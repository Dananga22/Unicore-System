package com.unicore.service;

import com.unicore.dto.BookingResponseDTO;
import com.unicore.dto.DayOperationsDTO;
import com.unicore.dto.OperationsCalendarDTO;
import com.unicore.dto.TicketResponseDTO;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOperationsService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final BookingService bookingService;
    private final TicketService ticketService;

    @Transactional(readOnly = true)
    public OperationsCalendarDTO getOperationsCalendarData(LocalDate start, LocalDate end) {
        LocalDate today = LocalDate.now();
        
        // 1. Global Summary Counts (Optimized using repo count methods)
        long todayBookingsCount = bookingRepository.findAllWithFilters(null, null, today).size();
        long pendingApprovals = bookingRepository.countByStatus(com.unicore.model.Booking.BookingStatus.PENDING);
        long openTicketsCount = ticketRepository.countByStatus(com.unicore.model.Ticket.TicketStatus.OPEN);
        long inProgressTickets = ticketRepository.countByStatus(com.unicore.model.Ticket.TicketStatus.IN_PROGRESS);
        long urgentTickets = ticketRepository.countByPriority(com.unicore.model.Ticket.Priority.HIGH) + 
                             ticketRepository.countByPriority(com.unicore.model.Ticket.Priority.CRITICAL);
        long activeResourcesCount = resourceRepository.countByStatus(com.unicore.model.Resource.ResourceStatus.ACTIVE);

        // 2. Calendar Data (Using Range Queries)
        List<com.unicore.model.Booking> rangeBookings = bookingRepository.findByDateBetween(start, end);
        
        // For tickets, we need to convert LocalDate to LocalDateTime for the range
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(23, 59, 59);
        List<com.unicore.model.Ticket> rangeTickets = ticketRepository.findByCreatedAtBetween(startDateTime, endDateTime);

        // Group data by date for efficient lookup
        Map<LocalDate, List<com.unicore.model.Booking>> bookingsByDate = rangeBookings.stream()
                .collect(Collectors.groupingBy(com.unicore.model.Booking::getDate));
        
        Map<LocalDate, List<com.unicore.model.Ticket>> ticketsByDate = rangeTickets.stream()
                .collect(Collectors.groupingBy(t -> t.getCreatedAt().toLocalDate()));

        Map<LocalDate, DayOperationsDTO> calendarMap = new HashMap<>();
        
        LocalDate current = start;
        while (!current.isAfter(end)) {
            LocalDate date = current;
            List<BookingResponseDTO> dayBookings = bookingsByDate.getOrDefault(date, Collections.emptyList()).stream()
                    .map(bookingService::mapToDTO)
                    .collect(Collectors.toList());
            
            List<TicketResponseDTO> dayTickets = ticketsByDate.getOrDefault(date, Collections.emptyList()).stream()
                    .map(ticketService::mapToDTO)
                    .collect(Collectors.toList());

            calendarMap.put(date, DayOperationsDTO.builder()
                    .bookings(dayBookings)
                    .tickets(dayTickets)
                    .ticketCount(dayTickets.size())
                    .build());
            
            current = current.plusDays(1);
        }

        // 3. Critical Maintenance (Urgent + Overdue + Recently Resolved)
        LocalDateTime overdueThreshold = LocalDateTime.now().minusDays(3);
        LocalDateTime recentThreshold = LocalDateTime.now().minusHours(24);
        
        List<com.unicore.model.Ticket.TicketStatus> criticalStatuses = Arrays.asList(
                com.unicore.model.Ticket.TicketStatus.OPEN, 
                com.unicore.model.Ticket.TicketStatus.IN_PROGRESS
        );

        List<com.unicore.model.Ticket> criticalTickets = ticketRepository.findAll().stream()
                .filter(t -> {
                    // Include if:
                    // 1. It's active (Open/In Progress) AND (High Priority OR Overdue)
                    if (criticalStatuses.contains(t.getStatus())) {
                        return t.getPriority() == com.unicore.model.Ticket.Priority.HIGH || 
                               t.getPriority() == com.unicore.model.Ticket.Priority.CRITICAL ||
                               t.getCreatedAt().isBefore(overdueThreshold);
                    }
                    // 2. It was resolved very recently (last 24h)
                    if (t.getStatus() == com.unicore.model.Ticket.TicketStatus.RESOLVED) {
                        return t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(recentThreshold);
                    }
                    return false;
                })
                .sorted((a, b) -> {
                    // Sorting logic: Urgent first, then Overdue, then others
                    boolean aUrgent = a.getPriority() == com.unicore.model.Ticket.Priority.HIGH || a.getPriority() == com.unicore.model.Ticket.Priority.CRITICAL;
                    boolean bUrgent = b.getPriority() == com.unicore.model.Ticket.Priority.HIGH || b.getPriority() == com.unicore.model.Ticket.Priority.CRITICAL;
                    
                    if (aUrgent && !bUrgent) return -1;
                    if (!aUrgent && bUrgent) return 1;
                    
                    return a.getCreatedAt().compareTo(b.getCreatedAt()); // Oldest first for same priority
                })
                .collect(Collectors.toList());

        List<TicketResponseDTO> maintenanceDTOs = criticalTickets.stream()
                .map(ticketService::mapToDTO)
                .collect(Collectors.toList());

        return OperationsCalendarDTO.builder()
                .todayBookingsCount(todayBookingsCount)
                .pendingApprovalsCount(pendingApprovals)
                .openTicketsCount(openTicketsCount)
                .inProgressTicketsCount(inProgressTickets)
                .urgentTicketsCount(urgentTickets)
                .totalActiveResources(activeResourcesCount)
                .calendarData(calendarMap)
                .criticalMaintenance(maintenanceDTOs)
                .build();
    }
}
