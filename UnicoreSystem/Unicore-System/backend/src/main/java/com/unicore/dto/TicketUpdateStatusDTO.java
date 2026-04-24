package com.unicore.dto;

import com.unicore.model.Ticket.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketUpdateStatusDTO {
    @NotNull(message = "Status is required")
    private TicketStatus status;
    private String resolutionNotes;
    private String rejectionReason;
    private Long assignedToId;
}
