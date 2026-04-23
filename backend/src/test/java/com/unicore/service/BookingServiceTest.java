package com.unicore.service;

import com.unicore.dto.BookingRequestDTO;
import com.unicore.dto.BookingResponseDTO;
import com.unicore.exception.ConflictException;
import com.unicore.model.Booking;
import com.unicore.model.Resource;
import com.unicore.model.User;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ResourceRepository resourceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBooking_shouldThrowConflict_whenOverlappingBookingExists() {
        BookingRequestDTO request = buildRequest();
        Resource resource = buildResource();
        User user = buildUser();

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(bookingRepository.existsConflictingBooking(
                eq(1L), eq(request.getDate()), eq(request.getStartTime()), eq(request.getEndTime()), any(), eq(null)
        )).thenReturn(true);

        assertThrows(ConflictException.class, () -> bookingService.createBooking(request, 10L));
    }

    @Test
    void createBooking_shouldPersistPendingBooking_whenNoConflictExists() {
        BookingRequestDTO request = buildRequest();
        Resource resource = buildResource();
        User user = buildUser();

        Booking savedBooking = Booking.builder()
                .id(99L)
                .resource(resource)
                .user(user)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(Booking.BookingStatus.PENDING)
                .build();

        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(bookingRepository.existsConflictingBooking(
                eq(1L), eq(request.getDate()), eq(request.getStartTime()), eq(request.getEndTime()), any(), eq(null)
        )).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponseDTO response = bookingService.createBooking(request, 10L);

        assertEquals(99L, response.getId());
        assertEquals(Booking.BookingStatus.PENDING, response.getStatus());
        assertEquals("Main Auditorium", response.getResourceName());
        verify(notificationService).notifyAdmins(any(), any(), any(), any(), eq(99L));
    }

    private BookingRequestDTO buildRequest() {
        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(1L);
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setPurpose("Department workshop");
        request.setExpectedAttendees(40);
        return request;
    }

    private Resource buildResource() {
        return Resource.builder()
                .id(1L)
                .name("Main Auditorium")
                .capacity(100)
                .location("Academic Block A")
                .status(Resource.ResourceStatus.ACTIVE)
                .type(Resource.ResourceType.LECTURE_HALL)
                .build();
    }

    private User buildUser() {
        return User.builder()
                .id(10L)
                .name("Student One")
                .email("student1@unicore.edu")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .password("encoded")
                .provider("local")
                .build();
    }
}
