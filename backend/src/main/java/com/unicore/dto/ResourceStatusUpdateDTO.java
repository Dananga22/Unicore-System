package com.unicore.dto;

import com.unicore.model.Resource.ResourceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResourceStatusUpdateDTO {
    @NotNull(message = "Status is required")
    private ResourceStatus status;
}
