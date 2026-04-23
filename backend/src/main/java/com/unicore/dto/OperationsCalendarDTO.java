package com.unicore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationsCalendarDTO {
    // Top Row Summary
    private long todayBookingsCount;
    private long pendingApprovalsCount;
    private long openTicketsCount;
    private long inProgressTicketsCount;
    private long urgentTicketsCount;
    private long totalActiveResources;

    // Calendar Grid Data
    private Map<LocalDate, DayOperationsDTO> calendarData;
    
    // Detailed Lists (for bottom panels of selected current date/overdue)
    private List<TicketResponseDTO> criticalMaintenance;
}
