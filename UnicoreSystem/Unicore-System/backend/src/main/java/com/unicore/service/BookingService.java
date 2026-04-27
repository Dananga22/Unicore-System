package com.unicore.service;

import com.unicore.dto.BookingAnalyticsDTO;
import com.unicore.dto.BookingRequestDTO;
import com.unicore.dto.BookingResponseDTO;
import com.unicore.exception.BadRequestException;
import com.unicore.exception.ConflictException;
import com.unicore.exception.ForbiddenException;
import com.unicore.exception.NotFoundException;
import com.unicore.model.Booking;
import com.unicore.model.Resource;
import com.unicore.model.Resource.ResourceStatus;
import com.unicore.model.User;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private static final Set<Booking.BookingStatus> ACTIVE_BOOKING_STATUSES =
            Set.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.APPROVED, Booking.BookingStatus.CANCELLATION_REQUESTED);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, Long userId) {
        validateBookingRequest(request);

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new BadRequestException("This resource is currently unavailable for booking");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != User.Role.USER) {
            throw new ForbiddenException("Only users with the role 'USER' can create booking requests");
        }

        if (request.getExpectedAttendees() != null && request.getExpectedAttendees() > resource.getCapacity()) {
            throw new BadRequestException("Expected attendees exceed the resource capacity");
        }

        ensureNoBookingConflict(resource.getId(), request.getDate(), request.getStartTime(), request.getEndTime(), null);

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(Booking.BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        
        // Notify User
        try {
            notificationService.createNotification(
                    user,
                    com.unicore.model.Notification.NotificationType.NEW_BOOKING,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "Booking Request Submitted",
                    "Your booking request for " + resource.getName() + " is pending review.",
                    savedBooking.getId()
            );

            // Notify Admins
            notificationService.notifyAdmins(
                    com.unicore.model.Notification.NotificationType.NEW_BOOKING,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "New Booking Request",
                    "A new booking request for " + resource.getName() + " has been submitted by " + user.getName() + ".",
                    savedBooking.getId()
            );
        } catch (Exception e) {
            log.error("Failed to send booking submission notifications for booking ID: {}", savedBooking.getId(), e);
        }


        return mapToDTO(savedBooking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingAnalyticsDTO getAnalyticsSummary() {
        long total = bookingRepository.count();
        long pending = bookingRepository.countByStatus(Booking.BookingStatus.PENDING);
        long approved = bookingRepository.countByStatus(Booking.BookingStatus.APPROVED);
        long rejected = bookingRepository.countByStatus(Booking.BookingStatus.REJECTED);
        long cancelled = bookingRepository.countByStatus(Booking.BookingStatus.CANCELLED);

        long cancellationRequests = bookingRepository.countByStatus(Booking.BookingStatus.CANCELLATION_REQUESTED);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        byStatus.put(Booking.BookingStatus.PENDING.name(), pending);
        byStatus.put(Booking.BookingStatus.APPROVED.name(), approved);
        byStatus.put(Booking.BookingStatus.REJECTED.name(), rejected);
        byStatus.put(Booking.BookingStatus.CANCELLED.name(), cancelled);
        byStatus.put(Booking.BookingStatus.CANCELLATION_REQUESTED.name(), cancellationRequests);

        Map<String, Long> popularity = bookingRepository.findResourceUsageCounts().stream()
                .limit(5)
                .collect(Collectors.toMap(
                        row -> String.valueOf(row[0]),
                        row -> ((Number) row[1]).longValue(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        Map<String, Long> trends = bookingRepository.findAll().stream()
                .filter(b -> b.getDate() != null)
                .collect(Collectors.groupingBy(b -> b.getDate().toString(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .limit(14)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        Map<String, Long> peakHours = bookingRepository.findPeakBookingHourCounts().stream()
                .collect(Collectors.toMap(
                        row -> String.format("%02d:00", ((Number) row[0]).intValue()),
                        row -> ((Number) row[1]).longValue(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        return BookingAnalyticsDTO.builder()
                .totalBookings(total)
                .pendingBookings(pending)
                .approvedBookings(approved)
                .rejectedBookings(rejected)
                .cancelledBookings(cancelled)
                .cancellationRequests(cancellationRequests)
                .bookingsByStatus(byStatus)
                .resourcePopularity(popularity)
                .bookingsByDate(trends)
                .peakBookingHours(peakHours)
                .build();
    }

    @Transactional(readOnly = true)
    public BookingResponseDTO getBookingById(Long bookingId, Long userId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (!isAdmin && !booking.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not authorized to view this booking");
        }
        return mapToDTO(booking);
    }

    @Transactional
    public BookingResponseDTO approveBooking(Long bookingId, Long adminId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Admin not found"));
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be approved");
        }

        ensureNoBookingConflict(
                booking.getResource().getId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId()
        );

        booking.setStatus(Booking.BookingStatus.APPROVED);
        booking.setReviewedBy(admin);


        try {
            notificationService.createNotification(
                    booking.getUser(),
                    com.unicore.model.Notification.NotificationType.BOOKING_APPROVED,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "Booking Approved",
                    "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " was approved.",
                    booking.getId()
            );
        } catch (Exception e) {
            log.error("Failed to send booking approval notification for booking ID: {}", booking.getId(), e);
        }


        return mapToDTO(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDTO rejectBooking(Long bookingId, Long adminId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("Admin not found"));
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be rejected");
        }

        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setReviewedBy(admin);
        booking.setReviewReason(reason);

        try {
            notificationService.createNotification(
                    booking.getUser(),
                    com.unicore.model.Notification.NotificationType.BOOKING_REJECTED,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "Booking Rejected",
                    "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " was rejected. Reason: " + reason,
                    booking.getId()
            );
        } catch (Exception e) {
            log.error("Failed to send booking rejection notification for booking ID: {}", booking.getId(), e);
        }


        return mapToDTO(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        User actingUser = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!booking.getUser().getId().equals(userId) && actingUser.getRole() != User.Role.ADMIN) {
            throw new ForbiddenException("Not authorized to cancel this booking");
        }
        if (booking.getStatus() != Booking.BookingStatus.PENDING && booking.getStatus() != Booking.BookingStatus.CANCELLATION_REQUESTED) {
            throw new BadRequestException("Only pending bookings or those with a cancellation request can be cancelled.");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        try {
            notificationService.createNotification(
                    booking.getUser(),
                    com.unicore.model.Notification.NotificationType.BOOKING_CANCELLED,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "Booking Cancelled",
                    "Your booking for " + booking.getResource().getName() + " on " + booking.getDate() + " has been cancelled.",
                    booking.getId()
            );

            // Notify Admins of cancellation if it was previously approved
            if (booking.getReviewedBy() != null) {
                notificationService.notifyAdmins(
                        com.unicore.model.Notification.NotificationType.BOOKING_CANCELLED,
                        com.unicore.model.Notification.ReferenceType.BOOKING,
                        "Booking Cancelled by User",
                        "The approved booking for " + booking.getResource().getName() + " was cancelled by " + booking.getUser().getName() + ".",
                        booking.getId()
                );
            }
        } catch (Exception e) {
            log.error("Failed to send booking cancellation notifications for booking ID: {}", booking.getId(), e);
        }


        return mapToDTO(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDTO updateBooking(Long id, BookingRequestDTO request, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not authorized to edit this booking");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be edited. Current status: " + booking.getStatus());
        }

        validateBookingRequest(request);

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new BadRequestException("The selected resource is currently unavailable");
        }

        if (request.getExpectedAttendees() != null && request.getExpectedAttendees() > resource.getCapacity()) {
            throw new BadRequestException("Expected attendees exceed the resource capacity");
        }

        // Run conflict check excluding the current booking
        ensureNoBookingConflict(resource.getId(), request.getDate(), request.getStartTime(), request.getEndTime(), id);

        // Update fields
        booking.setResource(resource);
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());

        // Booking remains PENDING
        Booking savedBooking = bookingRepository.save(booking);

        // Notify Admins of update
        try {
            notificationService.notifyAdmins(
                    com.unicore.model.Notification.NotificationType.NEW_BOOKING,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "Booking Request Updated",
                    "A pending booking request for " + resource.getName() + " was updated by " + booking.getUser().getName() + ". Please re-review.",
                    savedBooking.getId()
            );
        } catch (Exception e) {
            log.error("Failed to notify admins of booking update for ID: {}", savedBooking.getId());
        }

        return mapToDTO(savedBooking);
    }

    @Transactional(readOnly = true)
    public BookingAnalyticsDTO getUserAnalyticsSummary(Long userId) {
        long total = bookingRepository.countByUserId(userId);
        long pending = bookingRepository.countByUserIdAndStatus(userId, Booking.BookingStatus.PENDING);
        long approved = bookingRepository.countByUserIdAndStatus(userId, Booking.BookingStatus.APPROVED);
        long active = bookingRepository.countActiveBookings(
                userId, 
                Set.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.APPROVED), 
                java.time.LocalDate.now()
        );

        return BookingAnalyticsDTO.builder()
                .totalBookings(total)
                .pendingBookings(pending)
                .approvedBookings(approved)
                .activeBookings(active)
                .build();
    }

    private void validateBookingRequest(BookingRequestDTO request) {
        if (request.getResourceId() == null) {
            throw new BadRequestException("Resource ID is required");
        }
        if (request.getDate() == null) {
            throw new BadRequestException("Booking date is required");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new NotFoundException("Resource not found"));

        validateResourceAvailability(resource, request.getDate(), request.getStartTime(), request.getEndTime());
    }

    private void validateResourceAvailability(Resource resource, java.time.LocalDate date, 
                                            java.time.LocalTime start, java.time.LocalTime end) {
        java.time.DayOfWeek day = date.getDayOfWeek();
        List<com.unicore.model.AvailabilityWindow> windows = resource.getAvailabilityWindows();

        if (windows == null || windows.isEmpty()) {
            // Default Fallback: Mon-Fri, 08:00 - 17:00
            boolean isWeekend = (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY);
            if (isWeekend) {
                throw new BadRequestException("This resource is only available on weekdays (Mon-Fri)");
            }
            java.time.LocalTime defaultStart = java.time.LocalTime.of(8, 0);
            java.time.LocalTime defaultEnd = java.time.LocalTime.of(17, 0);
            
            if (start.isBefore(defaultStart) || end.isAfter(defaultEnd)) {
                throw new BadRequestException("Requested time is outside the standard operating hours (08:00 - 17:00)");
            }
            return;
        }

        // Check if falls within defined windows for the given day
        boolean fitsInWindow = windows.stream()
                .filter(w -> w.getDayOfWeek() == day)
                .anyMatch(w -> (start.equals(w.getStartTime()) || start.isAfter(w.getStartTime())) 
                            && (end.equals(w.getEndTime()) || end.isBefore(w.getEndTime())));

        if (!fitsInWindow) {
            throw new BadRequestException("The requested time does not align with the resource's availability schedule for " + day);
        }
    }

    private void ensureNoBookingConflict(Long resourceId, java.time.LocalDate date, java.time.LocalTime startTime,
                                         java.time.LocalTime endTime, Long excludeBookingId) {
        boolean conflictExists = bookingRepository.existsConflictingBooking(
                resourceId,
                date,
                startTime,
                endTime,
                ACTIVE_BOOKING_STATUSES,
                excludeBookingId
        );

        if (conflictExists) {
            throw new ConflictException(
                    "Booking conflict detected for this resource. The selected start and end time overlap an existing booking."
            );
        }
    }


    @Transactional
    public void requestCancellation(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not authorized to request cancellation for this booking");
        }

        if (booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new BadRequestException("Cancellation requests can only be made for approved bookings.");
        }

        try {
            // Update status
            booking.setStatus(Booking.BookingStatus.CANCELLATION_REQUESTED);
            bookingRepository.save(booking);

            // Notify Admins
            notificationService.notifyAdmins(
                    com.unicore.model.Notification.NotificationType.BOOKING_CANCELLATION_REQUEST,
                    com.unicore.model.Notification.ReferenceType.BOOKING,
                    "Cancellation Request",
                    "User " + booking.getUser().getName() + " has requested to cancel their approved booking for " + booking.getResource().getName() + " on " + booking.getDate() + ".",
                    booking.getId()
            );
            
            log.info("Cancellation request sent for booking ID: {}", booking.getId());
        } catch (Exception e) {
            log.error("Failed to send cancellation request notification for booking ID: {}", booking.getId(), e);
            throw new RuntimeException("Failed to send cancellation request to admin. Please try again.");
        }
    }

    public BookingResponseDTO mapToDTO(Booking booking) {
        BookingResponseDTO.BookingResponseDTOBuilder builder = BookingResponseDTO.builder()
                .id(booking.getId())
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .reviewReason(booking.getReviewReason());

        if (booking.getResource() != null) {
            builder.resourceId(booking.getResource().getId())
                   .resourceName(booking.getResource().getName());
        }

        if (booking.getUser() != null) {
            builder.userId(booking.getUser().getId())
                   .userName(booking.getUser().getName());
        }

        return builder.build();
    }
}
