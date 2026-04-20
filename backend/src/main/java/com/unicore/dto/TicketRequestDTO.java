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
    @Size(min = 3, max = 50, message = "Location must be between 3 and 50 characters")
    private String location;
    @NotBlank(message = "Ticket category is required")
    private String category;
    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters long")
    private String description;
    @NotNull(message = "Priority is required")
    private Priority priority;
    @Size(min = 5, max = 100, message = "Contact details must be between 5 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s@+\\-\\.,()]*$", message = "Contact details contains invalid characters")
    private String contactDetails;
}
