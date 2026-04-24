package com.unicore.controller;

import com.unicore.dto.BookingRequestDTO;
import com.unicore.dto.BookingResponseDTO;
import com.unicore.dto.SlotResponseDTO;
import com.unicore.security.SecurityUtils;
import com.unicore.service.BookingService;
import com.unicore.service.SlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotService slotService;
    private final BookingService bookingService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<List<SlotResponseDTO>> getSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Long resourceId) {
        return ResponseEntity.ok(slotService.getSlotsForResource(resourceId, date));
    }

    @PostMapping("/book")
    public ResponseEntity<BookingResponseDTO> bookSlot(
            Authentication authentication,
            @Valid @RequestBody BookingRequestDTO request) {
        BookingResponseDTO response = bookingService.createBooking(request, securityUtils.getCurrentUserId(authentication));
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
