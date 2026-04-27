package com.unicore.service;

import com.unicore.dto.DashboardSummaryDTO;
import com.unicore.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDashboardService {

    private final BookingService bookingService;
    private final TicketService ticketService;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryDTO getUserDashboardSummary(Long userId) {
        // Fetch User counts
        long unreadNotifications = notificationRepository.countByUserIdAndIsReadFalse(userId);

        return DashboardSummaryDTO.builder()
                .bookingAnalytics(bookingService.getUserAnalyticsSummary(userId))
                .ticketAnalytics(ticketService.getUserAnalyticsSummary(userId))
                .unreadNotificationsCount(unreadNotifications)
                .build();
    }
}
