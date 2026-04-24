package com.unicore.dto;

import com.unicore.model.Ticket.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRequestDTO {
    private Long resourceId;

    @NotBlank(message = "Location is required")
    @Size(min = 3, max = 120, message = "Location must be between 3 and 120 characters")
    private String location;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @Size(max = 150, message = "Contact details must be 150 characters or fewer")
    private String contactDetails;
}
