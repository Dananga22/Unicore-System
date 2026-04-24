package com.unicore.service;

import com.unicore.dto.BookingRequestDTO;
import com.unicore.dto.BookingResponseDTO;
import com.unicore.model.Booking;
import com.unicore.model.Resource;
import com.unicore.model.User;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest
@Import(BookingService.class)
class BookingCreationIntegrationTest {

    @Autowired
    private BookingService bookingService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ResourceRepository resourceRepository;
    @Autowired
    private UserRepository userRepository;

    @MockBean
    private NotificationService notificationService;

    @Test
    void createBooking_shouldPersistBookingAndReturnPendingStatus() {
        Resource resource = resourceRepository.save(Resource.builder()
                .name("Main Auditorium")
                .type(Resource.ResourceType.LECTURE_HALL)
                .capacity(120)
                .location("Academic Block A")
                .status(Resource.ResourceStatus.ACTIVE)
                .description("Auditorium")
                .build());

        User user = userRepository.save(User.builder()
                .name("Gayani")
                .email("gayani@unicore.edu")
                .password("encoded")
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .provider("local")
                .build());

        BookingRequestDTO request = new BookingRequestDTO();
        request.setResourceId(resource.getId());
        request.setDate(LocalDate.now().plusDays(2));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));
        request.setPurpose("Department Seminar");
        request.setExpectedAttendees(60);

        BookingResponseDTO response = bookingService.createBooking(request, user.getId());

        assertNotNull(response.getId());
        assertEquals(Booking.BookingStatus.PENDING, response.getStatus());
        assertEquals("Main Auditorium", response.getResourceName());
        assertEquals(1, bookingRepository.findAll().size());
    }
}
