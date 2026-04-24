package com.unicore.controller;

import com.unicore.dto.ResourceRequestDTO;
import com.unicore.dto.ResourceResponseDTO;
import com.unicore.dto.ResourceStatusUpdateDTO;
import com.unicore.exception.BadRequestException;
import com.unicore.model.Resource.ResourceStatus;
import com.unicore.model.Resource.ResourceType;
import com.unicore.security.SecurityUtils;
import com.unicore.service.FileStorageService;
import com.unicore.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final FileStorageService fileStorageService;
    private final SecurityUtils securityUtils;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ResourceResponseDTO> createResource(
            @Valid @RequestBody ResourceRequestDTO resourceRequestDTO,
            Authentication authentication) {
        ResourceResponseDTO response = resourceService.createResource(
                resourceRequestDTO,
                securityUtils.getCurrentUserId(authentication)
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponseDTO>> getResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String search) {
        List<ResourceResponseDTO> resources = resourceService.getAllResources(type, status, location, minCapacity, search);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponseDTO> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequestDTO resourceRequestDTO) {
        return ResponseEntity.ok(resourceService.updateResource(id, resourceRequestDTO));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponseDTO> updateResourceStatus(
            @PathVariable Long id,
            @Valid @RequestBody ResourceStatusUpdateDTO statusUpdateDTO) {
        return ResponseEntity.ok(resourceService.updateStatus(id, statusUpdateDTO.getStatus()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/image")
    public ResponseEntity<ResourceResponseDTO> uploadResourceImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        // 1. Validate File Size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 5MB limit");
        }
        
        // 2. Validate MIME Type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw new BadRequestException("Invalid file type. Only JPEG, PNG, and WEBP images are supported.");
        }

        String imageUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(resourceService.updateResourceImage(id, imageUrl));
    }
}
