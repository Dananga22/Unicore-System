package com.unicore.service;

import com.unicore.dto.UserResponseDTO;
import com.unicore.dto.UserRoleUpdateRequestDTO;
import com.unicore.dto.UserUpdateRequestDTO;
import com.unicore.exception.BadRequestException;
import com.unicore.exception.NotFoundException;
import com.unicore.model.User;
import com.unicore.model.User.Role;
import com.unicore.model.User.UserStatus;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponseDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers(Role role, UserStatus status, String search) {
        List<User> users = userRepository.searchUsers(role, status, search);
        return users.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public UserResponseDTO updateUserRole(Long id, UserRoleUpdateRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setRole(dto.getRole());
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public UserResponseDTO updateUserStatus(Long id, UserStatus status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setStatus(status);
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public UserResponseDTO updateUserInfo(Long id, UserUpdateRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(dto.getEmail())) {
            userRepository.findByEmail(dto.getEmail()).ifPresent(u -> {
                throw new BadRequestException("Email is already in use by another account");
            });
        }

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BadRequestException("Cannot delete user because they have associated records. Please deactivate them instead to preserve system history.");
        }
    }

    private UserResponseDTO mapToDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .picture(user.getPicture())
                .role(user.getRole())
                .status(user.getStatus())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
