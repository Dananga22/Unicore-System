package com.unicore.controller;

import com.unicore.dto.DashboardSummaryDTO;
import com.unicore.security.SecurityUtils;
import com.unicore.service.UserDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/dashboard")
@RequiredArgsConstructor
public class UserDashboardController {

    private final UserDashboardService userDashboardService;
    private final SecurityUtils securityUtils;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getUserDashboardSummary(Authentication authentication) {
        Long userId = securityUtils.getCurrentUserId(authentication);
        return ResponseEntity.ok(userDashboardService.getUserDashboardSummary(userId));
    }
}
