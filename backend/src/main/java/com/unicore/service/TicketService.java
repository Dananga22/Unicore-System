package com.unicore.service;

import com.unicore.dto.CommentRequestDTO;
import com.unicore.dto.CommentResponseDTO;
import com.unicore.dto.TicketHistoryResponseDTO;
import com.unicore.dto.TicketRequestDTO;
import com.unicore.dto.TicketResponseDTO;
import com.unicore.dto.TicketUpdateStatusDTO;
import com.unicore.exception.BadRequestException;
import com.unicore.exception.ForbiddenException;
import com.unicore.exception.NotFoundException;
import com.unicore.model.Comment;
import com.unicore.model.Resource;
import com.unicore.model.Ticket;
import com.unicore.model.TicketHistory;
import com.unicore.model.TicketImage;
import com.unicore.model.User;
import com.unicore.repository.CommentRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.TicketImageRepository;
import com.unicore.repository.TicketRepository;
import com.unicore.repository.TicketHistoryRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {


    private final TicketRepository ticketRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final TicketImageRepository ticketImageRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional
    public TicketResponseDTO createTicket(TicketRequestDTO request, Long userId) {
        User reportedBy = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Resource resource = null;
        if (request.getResourceId() != null) {
            resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new NotFoundException("Resource not found"));
        }

        Ticket ticket = Ticket.builder()
                .resource(resource)
                .location(request.getLocation() != null ? request.getLocation() : (resource != null ? resource.getLocation() : "Unknown"))
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .contactDetails(request.getContactDetails())
                .status(Ticket.TicketStatus.OPEN)
                .reportedBy(reportedBy)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        
        // Log initial history
        logHistory(savedTicket, reportedBy, "Ticket Created", null, "OPEN");

        // Notify User
        try {
            notificationService.createNotification(
                    reportedBy,
                    com.unicore.model.Notification.NotificationType.NEW_TICKET,
                    com.unicore.model.Notification.ReferenceType.TICKET,
                    "Ticket Created",
                    "Your ticket #" + savedTicket.getId() + " (" + savedTicket.getCategory() + ") has been logged successfully.",
                    savedTicket.getId()
            );
        } catch (Exception e) {
            log.error("Failed to send ticket creation notification to user for ticket ID: {}", savedTicket.getId(), e);
        }


        // Notify Admins
        try {
            boolean urgentTicket = savedTicket.getPriority() == Ticket.Priority.HIGH;
            notificationService.notifyAdmins(
                    com.unicore.model.Notification.NotificationType.NEW_TICKET,
                    com.unicore.model.Notification.ReferenceType.TICKET,
                    urgentTicket ? "URGENT Ticket Reported" : "New Ticket Reported",
                    "A new " + savedTicket.getPriority() + " priority ticket #" + savedTicket.getId() + " was reported by " + reportedBy.getName() + ".",
                    savedTicket.getId()
            );
        } catch (Exception e) {
            log.error("Failed to notify admins of ticket creation for ticket ID: {}", savedTicket.getId(), e);
        }


        return mapToDTO(savedTicket);
    }

    @Transactional
    public TicketResponseDTO updateTicket(Long id, TicketRequestDTO request, Long userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        if (!ticket.getReportedBy().getId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own tickets");
        }
        if (ticket.getStatus() != Ticket.TicketStatus.OPEN) {
            throw new BadRequestException("Only tickets in OPEN status can be edited");
        }

        Resource resource = null;
        if (request.getResourceId() != null) {
            resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new NotFoundException("Resource not found"));
        }

        ticket.setResource(resource);
        ticket.setLocation(request.getLocation() != null ? request.getLocation() : (resource != null ? resource.getLocation() : ticket.getLocation()));
        ticket.setCategory(request.getCategory());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setContactDetails(request.getContactDetails());

        Ticket savedTicket = ticketRepository.save(ticket);
        
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        logHistory(savedTicket, actor, "Ticket Updated", null, null);

        return mapToDTO(savedTicket);
    }

    @Transactional
    public TicketResponseDTO cancelTicket(Long id, Long userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        if (!ticket.getReportedBy().getId().equals(userId)) {
            throw new ForbiddenException("You can only cancel your own tickets");
        }
        if (ticket.getStatus() != Ticket.TicketStatus.OPEN) {
            throw new BadRequestException("Only tickets in OPEN status can be cancelled");
        }

        Ticket.TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(Ticket.TicketStatus.CANCELLED);
        
        Ticket savedTicket = ticketRepository.save(ticket);
        
        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        logHistory(savedTicket, actor, "Ticket Cancelled", oldStatus.name(), Ticket.TicketStatus.CANCELLED.name());

        return mapToDTO(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getTicketsByUser(Long userId) {
        return ticketRepository.findByReportedById(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getAllTickets() {
        return ticketRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.unicore.dto.TicketAnalyticsDTO getAnalyticsSummary() {
        List<Ticket> tickets = ticketRepository.findAll();
        
        long total = tickets.size();
        long open = tickets.stream().filter(t -> t.getStatus() == Ticket.TicketStatus.OPEN).count();
        long inProgress = tickets.stream().filter(t -> t.getStatus() == Ticket.TicketStatus.IN_PROGRESS).count();
        long resolved = tickets.stream().filter(t -> t.getStatus() == Ticket.TicketStatus.RESOLVED).count();
        long closed = tickets.stream().filter(t -> t.getStatus() == Ticket.TicketStatus.CLOSED).count();
        
        java.util.Map<String, Long> byCategory = tickets.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(Ticket::getCategory, Collectors.counting()));

        java.util.Map<String, Long> byStatus = ticketRepository.findTicketStatusDistribution().stream()
                .collect(Collectors.toMap(
                        row -> String.valueOf(row[0]),
                        row -> ((Number) row[1]).longValue(),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
                
        return com.unicore.dto.TicketAnalyticsDTO.builder()
                .totalTickets(total)
                .openTickets(open)
                .inProgressTickets(inProgress)
                .resolvedTickets(resolved)
                .closedTickets(closed)
                .ticketsByCategory(byCategory)
                .ticketsByStatus(byStatus)
                .build();
    }

    @Transactional(readOnly = true)
    public TicketResponseDTO getTicketById(Long id, Long userId, boolean privileged) {
        return mapToDTO(getAccessibleTicket(id, userId, privileged));
    }

    @Transactional
    public TicketResponseDTO updateTicketStatus(Long id, TicketUpdateStatusDTO request, Long adminId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        User actor = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        Ticket.TicketStatus oldStatus = ticket.getStatus();
        validateStatusUpdate(ticket, request);

        ticket.setStatus(request.getStatus());
        
        if (request.getResolutionNotes() != null) {
            ticket.setResolutionNotes(request.getResolutionNotes());
        }

        if (request.getRejectionReason() != null) {
            ticket.setRejectionReason(request.getRejectionReason());
        }
        
        // Auto-assign to performer if moving to progress/resolved/closed and unassigned
        if (ticket.getAssignedTo() == null) {
            ticket.setAssignedTo(actor);
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        
        // Log history
        logHistory(savedTicket, actor, "Status Updated", oldStatus.name(), request.getStatus().name());

        try {
            notificationService.createNotification(
                    savedTicket.getReportedBy(),
                    com.unicore.model.Notification.NotificationType.TICKET_STATUS_CHANGED,
                    com.unicore.model.Notification.ReferenceType.TICKET,
                    "Ticket Updated",
                    "Your ticket #" + savedTicket.getId() + " is now " + request.getStatus().name() + "." + 
                    (request.getStatus() == Ticket.TicketStatus.REJECTED && request.getRejectionReason() != null ? " Reason: " + request.getRejectionReason() : ""),
                    savedTicket.getId()
            );
        } catch (Exception e) {
            log.error("Failed to notify user of ticket status update for ticket ID: {}", savedTicket.getId(), e);
        }


        if (request.getStatus() == Ticket.TicketStatus.RESOLVED) {
            try {
                notificationService.createNotification(
                        savedTicket.getReportedBy(),
                        com.unicore.model.Notification.NotificationType.TICKET_STATUS_CHANGED,
                        com.unicore.model.Notification.ReferenceType.TICKET,
                        "Ticket Resolved",
                        "Great news! Your ticket #" + savedTicket.getId() + " has been marked as resolved.",
                        savedTicket.getId()
                );
            } catch (Exception e) {
                log.error("Failed to notify user of ticket resolution for ticket ID: {}", savedTicket.getId(), e);
            }
        }


        return mapToDTO(savedTicket);
    }

    @Transactional
    public TicketResponseDTO assignTicket(Long id, Long assignedToId, Long adminId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        
        User actor = userRepository.findById(adminId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        User assignedTo = userRepository.findById(assignedToId)
                .orElseThrow(() -> new NotFoundException("Assigned user not found"));

        ticket.setAssignedTo(assignedTo);
        Ticket savedTicket = ticketRepository.save(ticket);

        // Log history
        logHistory(savedTicket, actor, "Ticket Assigned to " + assignedTo.getName(), null, null);

        try {
            notificationService.createNotification(
                    assignedTo,
                    com.unicore.model.Notification.NotificationType.TICKET_ASSIGNED,
                    com.unicore.model.Notification.ReferenceType.TICKET,
                    "Ticket Assigned",
                    "You have been assigned ticket #" + savedTicket.getId() + ".",
                    savedTicket.getId()
            );
        } catch (Exception e) {
            log.error("Failed in TICKET_ASSIGNED notification to assignedTo user: {}", assignedTo.getId(), e);
        }


        return mapToDTO(savedTicket);
    }

    @Transactional
    public CommentResponseDTO addComment(Long ticketId, CommentRequestDTO request, Long userId, boolean privileged) {
        Ticket ticket = getAccessibleTicket(ticketId, userId, privileged);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Comment comment = Comment.builder()
                .ticket(ticket)
                .user(user)
                .content(request.getContent())
                .build();

        comment = commentRepository.save(comment);

        if (!user.getId().equals(ticket.getReportedBy().getId())) {
            try {
                notificationService.createNotification(
                        ticket.getReportedBy(),
                        com.unicore.model.Notification.NotificationType.TICKET_COMMENT,
                        com.unicore.model.Notification.ReferenceType.TICKET,
                        "New Ticket Comment",
                        user.getName() + " commented on your ticket #" + ticket.getId(),
                        ticket.getId()
                );
            } catch (Exception e) {
                log.error("Failed to notify user of new comment on ticket ID: {}", ticket.getId(), e);
            }
        }


        return mapCommentToDTO(comment);
    }

    @Transactional
    public CommentResponseDTO updateComment(Long commentId, CommentRequestDTO request, Long userId, boolean admin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));

        assertCommentAccess(comment, userId, admin);

        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isBlank()) {
            throw new BadRequestException("Comment content is required");
        }

        comment.setContent(content);
        return mapCommentToDTO(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, boolean admin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));

        assertCommentAccess(comment, userId, admin);
        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponseDTO> getCommentsForTicket(Long ticketId, Long userId, boolean privileged) {
        getAccessibleTicket(ticketId, userId, privileged);
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::mapCommentToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketResponseDTO uploadAttachment(Long ticketId, MultipartFile file, Long userId, boolean privileged) {
        Ticket ticket = getAccessibleTicket(ticketId, userId, privileged);
        
        if (ticketImageRepository.countByTicketId(ticketId) >= 3) {
            throw new BadRequestException("A maximum of 3 attachments is allowed per ticket");
        }

        // Validate File Type
        String contentType = file.getContentType();
        if (contentType == null || !List.of("image/png", "image/jpeg", "image/webp").contains(contentType.toLowerCase())) {
            throw new BadRequestException("Only image files (PNG, JPG, JPEG, WEBP) are allowed");
        }

        // Validate File Size (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size must be 5MB or smaller");
        }

        String imageUrl = fileStorageService.storeFile(file);
        TicketImage image = TicketImage.builder()
                .ticket(ticket)
                .imageUrl(imageUrl)
                .originalFileName(file.getOriginalFilename())
                .build();

        ticketImageRepository.save(image);
        return mapToDTO(ticketRepository.findById(ticketId).orElseThrow(() -> new NotFoundException("Ticket not found")));
    }

    private Ticket getAccessibleTicket(Long ticketId, Long userId, boolean privileged) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        boolean ownsTicket = ticket.getReportedBy().getId().equals(userId);
        boolean assignedUser = ticket.getAssignedTo() != null && ticket.getAssignedTo().getId().equals(userId);
        if (!privileged && !ownsTicket && !assignedUser) {
            throw new ForbiddenException("You do not have access to this ticket");
        }
        return ticket;
    }

    private void assertCommentAccess(Comment comment, Long userId, boolean admin) {
        boolean owner = comment.getUser() != null && comment.getUser().getId().equals(userId);
        if (!owner && !admin) {
            throw new ForbiddenException("Only the comment owner or an admin can modify this comment");
        }
    }

    private CommentResponseDTO mapCommentToDTO(Comment comment) {
        return CommentResponseDTO.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private void validateStatusUpdate(Ticket ticket, TicketUpdateStatusDTO request) {
        Ticket.TicketStatus currentStatus = ticket.getStatus();
        Ticket.TicketStatus nextStatus = request.getStatus();
        if (currentStatus == nextStatus) {
            return;
        }
        if (!isValidTransition(currentStatus, nextStatus)) {
            throw new BadRequestException("Invalid ticket status transition");
        }
        if ((request.getStatus() == Ticket.TicketStatus.RESOLVED || request.getStatus() == Ticket.TicketStatus.CLOSED)
                && (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank())) {
            throw new BadRequestException("Resolution notes are required when resolving or closing a ticket");
        }
    }

    private boolean isValidTransition(Ticket.TicketStatus currentStatus, Ticket.TicketStatus nextStatus) {
        return switch (currentStatus) {
            case OPEN -> nextStatus == Ticket.TicketStatus.IN_PROGRESS || nextStatus == Ticket.TicketStatus.REJECTED || nextStatus == Ticket.TicketStatus.CANCELLED;
            case IN_PROGRESS -> nextStatus == Ticket.TicketStatus.RESOLVED || nextStatus == Ticket.TicketStatus.REJECTED;
            case RESOLVED -> nextStatus == Ticket.TicketStatus.CLOSED;
            case CLOSED, REJECTED, CANCELLED -> false;
        };
    }

    private void logHistory(Ticket ticket, User user, String action, String from, String to) {
        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .performedBy(user)
                .action(action)
                .statusFrom(from)
                .statusTo(to)
                .build();
        ticketHistoryRepository.save(history);
    }

    private TicketResponseDTO mapToDTO(Ticket ticket) {
        List<String> images = ticket.getImages() != null
                ? ticket.getImages().stream().map(TicketImage::getImageUrl).collect(Collectors.toList())
                : List.of();
        
        List<TicketHistoryResponseDTO> history = ticket.getHistory() != null
                ? ticket.getHistory().stream()
                    .map(h -> TicketHistoryResponseDTO.builder()
                        .id(h.getId())
                        .action(h.getAction())
                        .statusFrom(h.getStatusFrom())
                        .statusTo(h.getStatusTo())
                        .performedById(h.getPerformedBy().getId())
                        .performedByName(h.getPerformedBy().getName())
                        .createdAt(h.getCreatedAt())
                        .build())
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList())
                : List.of();

        return TicketResponseDTO.builder()
                .id(ticket.getId())
                .resourceId(ticket.getResource() != null ? ticket.getResource().getId() : null)
                .resourceName(ticket.getResource() != null ? ticket.getResource().getName() : null)
                .location(ticket.getLocation())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .contactDetails(ticket.getContactDetails())
                .status(ticket.getStatus())
                .rejectionReason(ticket.getRejectionReason())
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : null)
                .resolutionNotes(ticket.getResolutionNotes())
                .reportedById(ticket.getReportedBy().getId())
                .reportedByName(ticket.getReportedBy().getName())
                .imageUrls(images)
                .history(history)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
