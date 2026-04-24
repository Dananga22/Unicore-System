package com.unicore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingAnalyticsDTO {
    private long totalBookings;
    private long pendingBookings;
    private long approvedBookings;
    private long rejectedBookings;
    private long cancelledBookings;
    private long cancellationRequests;
    private long activeBookings;
    
    private Map<String, Long> bookingsByStatus;
    private Map<String, Long> resourcePopularity; // Top 5 resources by booking count
    private Map<String, Long> bookingsByDate; // Last 7 days trend
    private Map<String, Long> peakBookingHours;
}
