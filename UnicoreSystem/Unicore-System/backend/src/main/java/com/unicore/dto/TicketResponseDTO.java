package com.unicore.dto;

import com.unicore.model.Ticket.Priority;
import com.unicore.model.Ticket.TicketStatus;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDTO {
    private Long id;
    private Long resourceId;
    private String resourceName;
    private String location;
    private String category;
    private String description;
    private Priority priority;
    private String contactDetails;
    private TicketStatus status;
    private String rejectionReason;
    private Long assignedToId;
    private String assignedToName;
    private String resolutionNotes;
    private Long reportedById;
    private String reportedByName;
    private List<String> imageUrls;
    private List<TicketHistoryResponseDTO> history;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
