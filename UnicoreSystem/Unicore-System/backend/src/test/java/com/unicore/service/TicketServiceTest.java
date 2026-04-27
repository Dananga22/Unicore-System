package com.unicore.service;

import com.unicore.dto.CommentRequestDTO;
import com.unicore.dto.CommentResponseDTO;
import com.unicore.dto.TicketRequestDTO;
import com.unicore.exception.ForbiddenException;
import com.unicore.model.Comment;
import com.unicore.model.Ticket;
import com.unicore.model.User;
import com.unicore.repository.CommentRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.TicketHistoryRepository;
import com.unicore.repository.TicketImageRepository;
import com.unicore.repository.TicketRepository;
import com.unicore.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private ResourceRepository resourceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private TicketImageRepository ticketImageRepository;
    @Mock
    private TicketHistoryRepository ticketHistoryRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TicketService ticketService;

    @Test
    void createTicket_shouldSendUrgentAdminNotification_whenPriorityIsHigh() {
        User reportedBy = User.builder()
                .id(5L)
                .name("Reporter")
                .email("reporter@unicore.edu")
                .role(User.Role.USER)
                .password("encoded")
                .build();

        TicketRequestDTO request = TicketRequestDTO.builder()
                .location("Academic Block A")
                .category("Hardware")
                .description("Projector is not powering on for lectures.")
                .priority(Ticket.Priority.HIGH)
                .contactDetails("ext-2241")
                .build();

        Ticket savedTicket = Ticket.builder()
                .id(77L)
                .location(request.getLocation())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .reportedBy(reportedBy)
                .status(Ticket.TicketStatus.OPEN)
                .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(reportedBy));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(savedTicket);

        ticketService.createTicket(request, 5L);

        verify(notificationService).notifyAdmins(
                any(),
                any(),
                eq("URGENT Ticket Reported"),
                any(),
                eq(77L)
        );
    }

    @Test
    void updateComment_shouldThrowForbidden_whenUserIsNotOwnerOrAdmin() {
        User owner = User.builder().id(1L).name("Owner").build();
        Ticket ticket = Ticket.builder().id(9L).reportedBy(owner).build();
        Comment comment = Comment.builder()
                .id(15L)
                .ticket(ticket)
                .user(owner)
                .content("Original comment")
                .build();

        CommentRequestDTO request = new CommentRequestDTO("Updated comment");

        when(commentRepository.findById(15L)).thenReturn(Optional.of(comment));

        assertThrows(ForbiddenException.class, () -> ticketService.updateComment(15L, request, 99L, false));
    }
}
