package com.unicore.controller;

import com.unicore.dto.OperationsCalendarDTO;
import com.unicore.service.AdminOperationsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/operations")
@RequiredArgsConstructor
public class AdminOperationsController {

    private final AdminOperationsService adminOperationsService;

    @GetMapping("/calendar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OperationsCalendarDTO> getOperationsCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(adminOperationsService.getOperationsCalendarData(start, end));
    }
}
