package com.unicore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotResponseDTO {
    private LocalTime startTime;
    private LocalTime endTime;
    private String state; // "AVAILABLE", "BOOKED", "UNAVAILABLE"
}
