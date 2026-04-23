package com.unicore.controller;

import com.unicore.dto.BookingAnalyticsDTO;
import com.unicore.dto.BookingRequestDTO;
import com.unicore.dto.BookingResponseDTO;
import com.unicore.dto.ReviewRequestDTO;
import com.unicore.exception.ForbiddenException;
import com.unicore.security.SecurityUtils;
import com.unicore.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final SecurityUtils securityUtils;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            Authentication authentication,
            @Valid @RequestBody BookingRequestDTO request) {
        BookingResponseDTO response = bookingService.createBooking(request, securityUtils.getCurrentUserId(authentication));
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/analytics/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingAnalyticsDTO> getAnalyticsSummary() {
        return ResponseEntity.ok(bookingService.getAnalyticsSummary());
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getUserBookings(securityUtils.getCurrentUserId(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDTO> getBookingById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(bookingService.getBookingById(id, securityUtils.getCurrentUserId(authentication), securityUtils.hasRole(authentication, "ADMIN")));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<BookingResponseDTO> approveBooking(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(bookingService.approveBooking(id, securityUtils.getCurrentUserId(authentication)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody ReviewRequestDTO reviewRequest) {
        return ResponseEntity.ok(
                bookingService.rejectBooking(id, securityUtils.getCurrentUserId(authentication), reviewRequest.getReason())
        );
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, securityUtils.getCurrentUserId(authentication)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<BookingResponseDTO> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingRequestDTO request,
            Authentication authentication) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request, securityUtils.getCurrentUserId(authentication)));
    }

    @PostMapping("/{id}/request-cancellation")
    public ResponseEntity<Void> requestCancellation(
            @PathVariable Long id,
            Authentication authentication) {
        bookingService.requestCancellation(id, securityUtils.getCurrentUserId(authentication));
        return ResponseEntity.ok().build();
    }
}
