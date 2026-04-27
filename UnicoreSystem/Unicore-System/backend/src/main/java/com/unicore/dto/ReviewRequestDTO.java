package com.unicore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewRequestDTO {
    @NotBlank(message = "Review reason is required")
    private String reason;
}
