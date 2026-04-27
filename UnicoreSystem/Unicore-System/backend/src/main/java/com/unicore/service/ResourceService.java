package com.unicore.service;

import com.unicore.dto.ResourceRequestDTO;
import com.unicore.dto.ResourceResponseDTO;
import com.unicore.exception.BadRequestException;
import com.unicore.exception.NotFoundException;
import com.unicore.model.AvailabilityWindow;
import com.unicore.model.Resource;
import com.unicore.model.Resource.ResourceStatus;
import com.unicore.model.Resource.ResourceType;
import com.unicore.model.User;
import com.unicore.repository.AvailabilityWindowRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final AvailabilityWindowRepository availabilityWindowRepository;

    @Transactional
    public ResourceResponseDTO createResource(ResourceRequestDTO dto, Long createdById) {
        validateResourceRequest(dto);
        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Resource resource = Resource.builder()
                .name(dto.getName())
                .type(dto.getType())
                .capacity(dto.getCapacity())
                .location(dto.getLocation())
                .status(dto.getStatus() != null ? dto.getStatus() : Resource.ResourceStatus.ACTIVE)
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .createdBy(createdBy)
                .build();

        resource = resourceRepository.save(resource);

        // 🔥 FIX: Create default availability windows (Mon-Fri, 08:00 - 17:00)
        createDefaultAvailability(resource);

        return mapToDTO(resource);
    }

    private void createDefaultAvailability(Resource resource) {
        LocalTime start = LocalTime.of(8, 0);
        LocalTime end = LocalTime.of(17, 0);
        
        List<AvailabilityWindow> windows = new ArrayList<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) continue;
            
            windows.add(AvailabilityWindow.builder()
                    .resource(resource)
                    .dayOfWeek(day)
                    .startTime(start)
                    .endTime(end)
                    .build());
        }
        availabilityWindowRepository.saveAll(windows);
        resource.getAvailabilityWindows().addAll(windows);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponseDTO> getAllResources(ResourceType type, ResourceStatus status, String location, Integer capacity, String search) {
        List<Resource> resources = resourceRepository.searchResources(type, status, location, capacity, search);
        return resources.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceResponseDTO getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        return mapToDTO(resource);
    }

    @Transactional
    public ResourceResponseDTO updateResource(Long id, ResourceRequestDTO dto) {
        validateResourceRequest(dto);
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found"));

        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        if (dto.getStatus() != null) {
            resource.setStatus(dto.getStatus());
        }
        resource.setDescription(dto.getDescription());
        if (dto.getImageUrl() != null) {
            resource.setImageUrl(dto.getImageUrl());
        }

        resource = resourceRepository.save(resource);
        return mapToDTO(resource);
    }

    @Transactional
    public void deleteResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        
        // As requested: Use soft delete (set status to OUT_OF_SERVICE)
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        resourceRepository.save(resource);
        
        /* 
        // Original hard delete logic if needed:
        try {
            resourceRepository.delete(resource);
            resourceRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("Resource cannot be deleted because it is referenced by other records. It has been set to OUT_OF_SERVICE instead.");
        }
        */
    }

    @Transactional
    public ResourceResponseDTO updateResourceImage(Long id, String imageUrl) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        resource.setImageUrl(imageUrl);
        return mapToDTO(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceResponseDTO updateStatus(Long id, ResourceStatus status) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource not found"));
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        if (resource.getStatus() == status) {
            throw new BadRequestException("Resource already has status " + status);
        }
        resource.setStatus(status);
        return mapToDTO(resourceRepository.save(resource));
    }

    private void validateResourceRequest(ResourceRequestDTO dto) {
        if (dto.getName() == null || dto.getName().trim().length() < 3) {
            throw new BadRequestException("Resource name must be at least 3 characters long");
        }
        if (dto.getType() == null) {
            throw new BadRequestException("Resource type is required");
        }
        if (dto.getLocation() == null || dto.getLocation().isBlank()) {
            throw new BadRequestException("Resource location is required");
        }
        if (dto.getCapacity() == null || dto.getCapacity() <= 0) {
            throw new BadRequestException("Capacity must be greater than 0");
        }
        if (dto.getDescription() == null || dto.getDescription().trim().length() < 10) {
            throw new BadRequestException("Description must be at least 10 characters long");
        }
        
        // Duplicate check (name + location) - excluding current resource if updating
        // This is simplified; usually we'd pass the ID to exclude it
    }

    private ResourceResponseDTO mapToDTO(Resource resource) {
        return ResourceResponseDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus())
                .description(resource.getDescription())
                .imageUrl(resource.getImageUrl())
                .createdById(resource.getCreatedBy() != null ? resource.getCreatedBy().getId() : null)
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
