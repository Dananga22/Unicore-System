package com.unicore.controller;

import com.unicore.dto.CommentRequestDTO;
import com.unicore.dto.CommentResponseDTO;
import com.unicore.security.SecurityUtils;
import com.unicore.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final TicketService ticketService;
    private final SecurityUtils securityUtils;

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequestDTO request,
            Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean admin = securityUtils.hasRole(authentication, "ADMIN");
        return ResponseEntity.ok(ticketService.updateComment(id, request, userId, admin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        boolean admin = securityUtils.hasRole(authentication, "ADMIN");
        ticketService.deleteComment(id, userId, admin);
        return ResponseEntity.noContent().build();
    }
}
