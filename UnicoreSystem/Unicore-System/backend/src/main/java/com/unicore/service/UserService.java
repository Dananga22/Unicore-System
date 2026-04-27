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
import com.unicore.repository.NotificationRepository;
import com.unicore.repository.CommentRepository;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final CommentRepository commentRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;

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
    public UserResponseDTO updateUserRole(Long id, UserRoleUpdateRequestDTO dto, Long actorId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Safety: Cannot remove admin role from self if last admin
        if (user.getId().equals(actorId) && user.getRole() == Role.ADMIN && dto.getRole() != Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new BadRequestException("Cannot remove your own ADMIN role. You are the last remaining Administrator.");
            }
        }

        user.setRole(dto.getRole());
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public UserResponseDTO updateUserStatus(Long id, UserStatus status, Long actorId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (status == UserStatus.INACTIVE) {
            // Safety: Cannot deactivate self
            if (user.getId().equals(actorId)) {
                throw new BadRequestException("You cannot deactivate your own account.");
            }
            // Safety: Cannot deactivate last admin
            if (user.getRole() == Role.ADMIN) {
                long adminCount = userRepository.countByRole(Role.ADMIN);
                if (adminCount <= 1) {
                    throw new BadRequestException("Cannot deactivate the last remaining Administrator.");
                }
            }
        }

        user.setStatus(status);
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public UserResponseDTO updateUserInfo(Long id, UserUpdateRequestDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        String normalizedEmail = dto.getEmail().trim().toLowerCase();
        String normalizedName = dto.getName().trim();

        if (normalizedName.length() < 3) throw new BadRequestException("Name must be at least 3 characters");

        // If it's a local user (has password and no provider or provider='local'), enforced institutional email
        boolean isLocalUser = user.getPassword() != null && (user.getProvider() == null || user.getProvider().equals("local"));
        if (isLocalUser && !normalizedEmail.endsWith("@unicore.edu")) {
            throw new BadRequestException("Local accounts must use an @unicore.edu email address.");
        }

        if (!user.getEmail().equalsIgnoreCase(normalizedEmail)) {
            userRepository.findByEmail(normalizedEmail).ifPresent(u -> {
                throw new BadRequestException("Email is already in use by another account");
            });
        }

        user.setName(normalizedName);
        user.setEmail(normalizedEmail);
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public void deleteUser(Long id, Long actorId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getId().equals(actorId)) {
            throw new BadRequestException("You cannot delete your own account.");
        }

        if (user.getRole() == Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new BadRequestException("Cannot delete the last remaining Administrator.");
            }
        }

        // Cleanup dependencies safely
        try {
            notificationRepository.deleteByUserId(id);
            commentRepository.deleteByUserId(id);
            bookingRepository.deleteByUserId(id);
            ticketRepository.deleteByReportedById(id);
            ticketRepository.deleteByAssignedToId(id);
            
            userRepository.delete(user);
            userRepository.flush();
        } catch (Exception e) {
            throw new BadRequestException("Failed to delete user due to complex dependencies. Please ensure they have no active tickets or bookings first.");
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
