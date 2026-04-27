package com.unicore.config;

import com.unicore.model.AvailabilityWindow;
import com.unicore.model.Booking;
import com.unicore.model.Resource;
import com.unicore.model.Ticket;
import com.unicore.model.User;
import com.unicore.repository.AvailabilityWindowRepository;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.TicketRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository,
            ResourceRepository resourceRepository,
            AvailabilityWindowRepository windowRepository,
            BookingRepository bookingRepository,
            TicketRepository ticketRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {

        return args -> {
            String defaultPass = passwordEncoder.encode("uniCore@123");

            if (userRepository.findByEmail("staff1@sliit.lk").isEmpty()) {
                userRepository.save(User.builder()
                        .name("Staff 1")
                        .email("staff1@sliit.lk")
                        .password(defaultPass)
                        .role(User.Role.ADMIN)
                        .status(User.UserStatus.INACTIVE)
                        .provider("local")
                        .build());
            }

            if (userRepository.findByEmail("admin@sliit.lk").isEmpty()) {
                userRepository.save(User.builder()
                        .name("Admin")
                        .email("admin@sliit.lk")
                        .password(defaultPass)
                        .role(User.Role.ADMIN)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());
            }

            if (userRepository.findByEmail("gayani@unicore.edu").isEmpty()) {
                userRepository.save(User.builder()
                        .name("Gayani")
                        .email("gayani@unicore.edu")
                        .password(passwordEncoder.encode("gaya1999"))
                        .role(User.Role.USER)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());
            }

            if (userRepository.findByEmail("sithumini@unicore.edu").isEmpty()) {
                userRepository.save(User.builder()
                        .name("Sithumini")
                        .email("sithumini@unicore.edu")
                        .password(defaultPass)
                        .role(User.Role.USER)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());
            }

            try {
                jdbcTemplate.execute("UPDATE users SET created_at = '2026-03-22 09:45:42' WHERE email = 'staff1@sliit.lk'");
                jdbcTemplate.execute("UPDATE users SET created_at = '2026-03-22 09:45:42' WHERE email = 'admin@sliit.lk'");
                jdbcTemplate.execute("UPDATE users SET created_at = '2026-03-22 09:53:32' WHERE email = 'dananga@unicore.edu'");
                jdbcTemplate.execute("UPDATE users SET created_at = '2026-03-22 09:56:54' WHERE email = 'gayani@unicore.edu'");
                jdbcTemplate.execute("UPDATE users SET created_at = '2026-03-24 16:46:05' WHERE email = 'sithumini@unicore.edu'");
            } catch (Exception e) {
                System.out.println("Failed to restore created_at timestamps: " + e.getMessage());
            }

            if (userRepository.count() == 0) {
                userRepository.save(User.builder()
                        .name("Student One")
                        .email("student1@unicore.edu")
                        .password(passwordEncoder.encode("Student@123"))
                        .role(User.Role.USER)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());

                userRepository.save(User.builder()
                        .name("Technician One")
                        .email("technician@unicore.edu")
                        .password(passwordEncoder.encode("Technician@123"))
                        .role(User.Role.TECHNICIAN)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());

                userRepository.save(User.builder()
                        .name("System Admin")
                        .email("admin@unicore.edu")
                        .password(passwordEncoder.encode("Admin@123"))
                        .role(User.Role.ADMIN)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());
            }

            User dananga = userRepository.findByEmail("dananga@unicore.edu").orElse(null);
            if (dananga != null) {
                dananga.setPassword(passwordEncoder.encode("dana2003"));
                dananga.setStatus(User.UserStatus.ACTIVE);
                userRepository.save(dananga);
            } else {
                userRepository.save(User.builder()
                        .name("Dananga")
                        .email("dananga@unicore.edu")
                        .password(passwordEncoder.encode("dana2003"))
                        .role(User.Role.ADMIN)
                        .status(User.UserStatus.ACTIVE)
                        .provider("local")
                        .build());
            }

            if (resourceRepository.count() == 0) {
                resourceRepository.save(Resource.builder()
                        .name("Main Auditorium")
                        .type(Resource.ResourceType.LECTURE_HALL)
                        .capacity(250)
                        .location("Academic Block A")
                        .status(Resource.ResourceStatus.ACTIVE)
                        .description("Premium auditorium for university-wide events and lectures.")
                        .build());

                resourceRepository.save(Resource.builder()
                        .name("Networking Lab")
                        .type(Resource.ResourceType.LAB)
                        .capacity(40)
                        .location("Technology Center")
                        .status(Resource.ResourceStatus.ACTIVE)
                        .description("Configured for networking, cybersecurity, and practical lab sessions.")
                        .build());

                resourceRepository.save(Resource.builder()
                        .name("Boardroom Alpha")
                        .type(Resource.ResourceType.MEETING_ROOM)
                        .capacity(18)
                        .location("Administration Wing")
                        .status(Resource.ResourceStatus.ACTIVE)
                        .description("Executive meeting room with display and conferencing facilities.")
                        .build());

                resourceRepository.save(Resource.builder()
                        .name("4K Projector Unit")
                        .type(Resource.ResourceType.EQUIPMENT)
                        .capacity(1)
                        .location("IT Support Room")
                        .status(Resource.ResourceStatus.ACTIVE)
                        .description("Portable 4K presentation projector for academic events.")
                        .build());
            }

            if (bookingRepository.count() == 0) {
                User gayani = userRepository.findByEmail("gayani@unicore.edu").orElse(null);
                Resource auditorium = resourceRepository.findAll().stream()
                        .filter(r -> r.getName().equals("Main Auditorium"))
                        .findFirst().orElse(null);

                if (gayani != null && auditorium != null) {
                    bookingRepository.save(Booking.builder()
                            .user(gayani)
                            .resource(auditorium)
                            .date(java.time.LocalDate.now().plusDays(2))
                            .startTime(java.time.LocalTime.of(10, 0))
                            .endTime(java.time.LocalTime.of(12, 0))
                            .purpose("Department Seminar")
                            .expectedAttendees(50)
                            .status(Booking.BookingStatus.PENDING)
                            .build());
                }
            }

            if (ticketRepository.count() == 0) {
                User sithumini = userRepository.findByEmail("sithumini@unicore.edu").orElse(null);
                Resource lab = resourceRepository.findAll().stream()
                        .filter(r -> r.getName().equals("Networking Lab"))
                        .findFirst().orElse(null);

                if (sithumini != null) {
                    ticketRepository.save(Ticket.builder()
                            .reportedBy(sithumini)
                            .resource(lab)
                            .location("Technology Center - Lab 2")
                            .category("Hardware")
                            .description("Projector not turning on in the networking lab.")
                            .priority(Ticket.Priority.HIGH)
                            .status(Ticket.TicketStatus.OPEN)
                            .build());
                }
            }
        };
    }
}