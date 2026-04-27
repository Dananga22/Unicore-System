package com.unicore.service;

import com.unicore.dto.DashboardSummaryDTO;
import com.unicore.dto.UserResponseDTO;
import com.unicore.model.User;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final BookingService bookingService;
    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryDTO getDashboardSummary() {
        // Fetch User count (Active check could be added here)
        long totalUsers = userRepository.count();
        
        // Fetch Active Resources count
        long activeResources = resourceRepository.countByStatus(com.unicore.model.Resource.ResourceStatus.ACTIVE);
        
        // Fetch Recent Registrations (Last 5)
        List<UserResponseDTO> recentUsers = userRepository.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5)
                .map(this::mapToUserDTO)
                .collect(Collectors.toList());

        return DashboardSummaryDTO.builder()
                .bookingAnalytics(bookingService.getAnalyticsSummary())
                .ticketAnalytics(ticketService.getAnalyticsSummary())
                .totalUsers(totalUsers)
                .activeResourcesCount(activeResources)
                .recentRegistrations(recentUsers)
                .build();
    }

    @Transactional(readOnly = true)
    public long getTotalBookings() {
        return bookingService.getAnalyticsSummary().getTotalBookings();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getMostUsedResources() {
        return bookingService.getAnalyticsSummary().getResourcePopularity();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getPeakBookingHours() {
        return bookingService.getAnalyticsSummary().getPeakBookingHours();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTicketStatusDistribution() {
        return ticketService.getAnalyticsSummary().getTicketsByStatus();
    }

    private UserResponseDTO mapToUserDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
