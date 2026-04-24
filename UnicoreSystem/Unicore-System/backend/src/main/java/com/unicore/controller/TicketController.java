package com.unicore.controller;

import com.unicore.dto.CommentRequestDTO;
import com.unicore.dto.CommentResponseDTO;
import com.unicore.dto.TicketRequestDTO;
import com.unicore.dto.TicketResponseDTO;
import com.unicore.dto.TicketUpdateStatusDTO;
import com.unicore.exception.ForbiddenException;
import com.unicore.security.SecurityUtils;
import com.unicore.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public ResponseEntity<TicketResponseDTO> createTicket(
            @Valid @RequestBody TicketRequestDTO request,
            Authentication authentication) {
        TicketResponseDTO response = ticketService.createTicket(request, securityUtils.getCurrentUserId(authentication));
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TicketResponseDTO>> getTickets(
            @RequestParam(required = false) Boolean adminMode,
            Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean privileged = securityUtils.hasRole(authentication, "ADMIN")
                || securityUtils.hasRole(authentication, "TECHNICIAN");

        if (Boolean.TRUE.equals(adminMode)) {
            if (!privileged) {
                throw new ForbiddenException("Only admins and technicians can view all tickets");
            }
            return ResponseEntity.ok(ticketService.getAllTickets());
        }
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    @GetMapping("/analytics/summary")
    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    public ResponseEntity<com.unicore.dto.TicketAnalyticsDTO> getAnalyticsSummary() {
        return ResponseEntity.ok(ticketService.getAnalyticsSummary());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> getTicketById(@PathVariable Long id, Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean privileged = securityUtils.hasRole(authentication, "ADMIN")
                || securityUtils.hasRole(authentication, "TECHNICIAN");
        return ResponseEntity.ok(ticketService.getTicketById(id, userId, privileged));
    }

    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponseDTO> updateTicketStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketUpdateStatusDTO statusDTO,
            Authentication authentication) {
        return ResponseEntity.ok(
                ticketService.updateTicketStatus(id, statusDTO, securityUtils.getCurrentUserId(authentication))
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN','TECHNICIAN')")
    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketResponseDTO> assignTicket(
            @PathVariable Long id,
            @RequestParam Long assignedToId,
            Authentication authentication) {
        return ResponseEntity.ok(
                ticketService.assignTicket(id, assignedToId, securityUtils.getCurrentUserId(authentication))
        );
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponseDTO> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequestDTO request,
            Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean privileged = securityUtils.hasRole(authentication, "ADMIN")
                || securityUtils.hasRole(authentication, "TECHNICIAN");
        CommentResponseDTO response = ticketService.addComment(id, request, userId, privileged);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long id, Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean privileged = securityUtils.hasRole(authentication, "ADMIN")
                || securityUtils.hasRole(authentication, "TECHNICIAN");
        return ResponseEntity.ok(ticketService.getCommentsForTicket(id, userId, privileged));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketResponseDTO> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean privileged = securityUtils.hasRole(authentication, "ADMIN")
                || securityUtils.hasRole(authentication, "TECHNICIAN");
        return ResponseEntity.ok(ticketService.uploadAttachment(id, file, userId, privileged));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponseDTO> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(
                ticketService.updateTicket(id, request, securityUtils.getCurrentUserId(authentication))
        );
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<TicketResponseDTO> cancelTicket(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(
                ticketService.cancelTicket(id, securityUtils.getCurrentUserId(authentication))
        );
    }
}
