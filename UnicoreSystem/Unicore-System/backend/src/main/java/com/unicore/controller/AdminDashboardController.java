package com.unicore.controller;

import com.unicore.dto.DashboardSummaryDTO;
import com.unicore.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary() {
        return ResponseEntity.ok(adminDashboardService.getDashboardSummary());
    }

    @GetMapping("/analytics/bookings/total")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getTotalBookings() {
        return ResponseEntity.ok(Map.of("totalBookings", adminDashboardService.getTotalBookings()));
    }

    @GetMapping("/analytics/resources/most-used")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getMostUsedResources() {
        return ResponseEntity.ok(adminDashboardService.getMostUsedResources());
    }

    @GetMapping("/analytics/bookings/peak-hours")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getPeakBookingHours() {
        return ResponseEntity.ok(adminDashboardService.getPeakBookingHours());
    }

    @GetMapping("/analytics/tickets/status-distribution")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getTicketStatusDistribution() {
        return ResponseEntity.ok(adminDashboardService.getTicketStatusDistribution());
    }
}
