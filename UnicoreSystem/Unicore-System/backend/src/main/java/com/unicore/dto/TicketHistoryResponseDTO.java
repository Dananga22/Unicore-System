package com.unicore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketHistoryResponseDTO {
    private Long id;
    private String action;
    private String statusFrom;
    private String statusTo;
    private Long performedById;
    private String performedByName;
    private LocalDateTime createdAt;
}
