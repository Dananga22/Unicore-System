package com.unicore.dto;

import com.unicore.model.User.Role;
import com.unicore.model.User.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDTO {
    private Long id;
    private String email;
    private String name;
    private String picture;
    private Role role;
    private UserStatus status;
    private String provider;
    private LocalDateTime createdAt;
}
