package com.unicore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AuthRequestDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@unicore\\.edu$", message = "Institutional email required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
