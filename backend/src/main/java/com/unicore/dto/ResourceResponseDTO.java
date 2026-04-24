package com.unicore.dto;

import com.unicore.model.Resource.ResourceStatus;
import com.unicore.model.Resource.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponseDTO {
    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;
    private String description;
    private String imageUrl;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
