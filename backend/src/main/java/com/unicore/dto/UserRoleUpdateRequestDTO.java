package com.unicore.dto;

import com.unicore.model.User.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleUpdateRequestDTO {
    @NotNull(message = "Role is required")
    private Role role;
}
