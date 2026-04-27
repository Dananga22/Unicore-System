package com.unicore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private BookingAnalyticsDTO bookingAnalytics;
    private TicketAnalyticsDTO ticketAnalytics;
    private long totalUsers;
    private long activeResourcesCount;
    private long unreadNotificationsCount;
    private List<UserResponseDTO> recentRegistrations;
}
