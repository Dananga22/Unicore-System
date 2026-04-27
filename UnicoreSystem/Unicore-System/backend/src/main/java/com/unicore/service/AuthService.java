package com.unicore.service;

import com.unicore.dto.AuthRequestDTO;
import com.unicore.dto.AuthResponseDTO;
import com.unicore.dto.RegisterRequestDTO;
import com.unicore.dto.UserResponseDTO;
import com.unicore.exception.BadRequestException;
import com.unicore.exception.ConflictException;
import com.unicore.exception.ForbiddenException;
import com.unicore.exception.UnauthorizedException;

import com.unicore.model.User;
import com.unicore.repository.UserRepository;
import com.unicore.security.JwtTokenProvider;
import com.unicore.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public UserResponseDTO register(RegisterRequestDTO request) {
        String normalizedName = normalizeName(request.getName());
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Service level check for domain (double-safety)
        if (!normalizedEmail.endsWith("@unicore.edu")) {
            throw new BadRequestException("Only institutional emails (@unicore.edu) are allowed for local registration");
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ConflictException("Email address already exists");
        }

        User user = User.builder()
                .name(normalizedName)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .status(User.UserStatus.ACTIVE)
                .provider("local")
                .build();

        User savedUser = userRepository.save(user);
        return mapUser(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO login(AuthRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Use a generic error message for security
        String genericErrorMessage = "Invalid email or password";

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException(genericErrorMessage));

        if (user.getStatus() == User.UserStatus.INACTIVE) {
            throw new ForbiddenException("Your account is inactive. Please contact admin.");
        }

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(genericErrorMessage);
        }

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return new AuthResponseDTO(tokenProvider.generateToken(authentication), mapUser(user));
    }

    private String normalizeEmail(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        if (normalizedEmail.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        return normalizedEmail;
    }

    private String normalizeName(String name) {
        String normalizedName = name == null ? "" : name.trim();
        if (normalizedName.isBlank()) {
            throw new BadRequestException("Name is required");
        }
        if (normalizedName.length() < 3) {
            throw new BadRequestException("Name must be at least 3 characters");
        }
        return normalizedName;
    }

    private UserResponseDTO mapUser(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .picture(user.getPicture())
                .provider(user.getProvider() == null ? "local" : user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
