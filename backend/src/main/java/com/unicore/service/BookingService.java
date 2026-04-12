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
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {


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

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                resource.getId(), request.getDate(), request.getStartTime(), request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new ConflictException("Resource is already booked during this time. Please select another time.");
        }

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
        List<Booking> all = bookingRepository.findAll();
        
        long total = all.size();
        long pending = all.stream().filter(b -> b.getStatus() == Booking.BookingStatus.PENDING).count();
        long approved = all.stream().filter(b -> b.getStatus() == Booking.BookingStatus.APPROVED).count();
        long rejected = all.stream().filter(b -> b.getStatus() == Booking.BookingStatus.REJECTED).count();
        long cancelled = all.stream().filter(b -> b.getStatus() == Booking.BookingStatus.CANCELLED).count();

        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(b -> b.getStatus().name(), Collectors.counting()));

        Map<String, Long> popularity = all.stream()
                .collect(Collectors.groupingBy(b -> b.getResource().getName(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        Map<String, Long> trends = all.stream()
                .filter(b -> b.getDate() != null)
                .collect(Collectors.groupingBy(b -> b.getDate().toString(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .limit(14) // Last 14 days or so
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        return BookingAnalyticsDTO.builder()
                .totalBookings(total)
                .pendingBookings(pending)
                .approvedBookings(approved)
                .rejectedBookings(rejected)
                .cancelledBookings(cancelled)
                .bookingsByStatus(byStatus)
                .resourcePopularity(popularity)
                .bookingsByDate(trends)
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

        // Final conflict check before approval
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResource().getId(), booking.getDate(), booking.getStartTime(), booking.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new ConflictException("Cannot approve this booking. The resource is already booked during this time by an approved request.");
        }

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

        if (!booking.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not authorized to cancel this booking");
        }
        if (booking.getStatus() == Booking.BookingStatus.REJECTED || booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new BadRequestException("This booking can no longer be cancelled");
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
            if (booking.getStatus() == Booking.BookingStatus.APPROVED) {
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
    }


    private BookingResponseDTO mapToDTO(Booking booking) {
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
