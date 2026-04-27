package com.unicore.controller;

import com.unicore.dto.UserResponseDTO;
import com.unicore.dto.UserRoleUpdateRequestDTO;
import com.unicore.dto.UserUpdateRequestDTO;
import com.unicore.exception.ForbiddenException;
import com.unicore.model.User.Role;
import com.unicore.model.User.UserStatus;
import com.unicore.security.SecurityUtils;
import com.unicore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("MySQL connection is working securely!");
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getUserProfile(securityUtils.getCurrentUserId(authentication)));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateCurrentUser(
            Authentication authentication,
            @Valid @RequestBody UserUpdateRequestDTO dto) {
        return ResponseEntity.ok(userService.updateUserInfo(securityUtils.getCurrentUserId(authentication), dto));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getAllUsers(role, status, search));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponseDTO> updateUserRole(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody UserRoleUpdateRequestDTO requestDTO) {
        return ResponseEntity.ok(userService.updateUserRole(id, requestDTO, securityUtils.getCurrentUserId(authentication)));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> updateUserStatus(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam UserStatus status) {
        return ResponseEntity.ok(userService.updateUserStatus(id, status, securityUtils.getCurrentUserId(authentication)));
    }

    @PutMapping("/{id}/details")
    public ResponseEntity<UserResponseDTO> updateUserInfo(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody UserUpdateRequestDTO dto) {
        Long currentUserId = securityUtils.getCurrentUserId(authentication);
        boolean isAdmin = securityUtils.hasRole(authentication, "ADMIN");
        if (!isAdmin && !currentUserId.equals(id)) {
            throw new ForbiddenException("You can only update your own profile");
        }
        return ResponseEntity.ok(userService.updateUserInfo(id, dto));
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        userService.deleteUser(id, securityUtils.getCurrentUserId(authentication));
        return ResponseEntity.noContent().build();
    }
}
