package com.unicore.service;

import com.unicore.dto.NotificationResponseDTO;
import com.unicore.exception.ForbiddenException;
import com.unicore.exception.NotFoundException;
import com.unicore.model.Notification;
import com.unicore.model.User;
import com.unicore.repository.NotificationRepository;
import com.unicore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(User user, Notification.NotificationType type, Notification.ReferenceType refType, String title, String message, Long referenceId) {
        // --- HARD VALIDATION BEGIN ---
        if (message.toLowerCase().contains("ticket") && refType != Notification.ReferenceType.TICKET) {
            throw new IllegalStateException("Runtime Error: Notification refType mismatch! Message contains 'ticket' but refType is " + refType);
        }
        if (message.toLowerCase().contains("pending") && type == Notification.NotificationType.BOOKING_APPROVED) {
            throw new IllegalStateException("Runtime Error: Notification type mismatch! Message contains 'pending' but type is BOOKING_APPROVED");
        }
        // --- HARD VALIDATION END ---

        log.info("Creating notification: type={}, refType={}, title={}, message={}", type, refType, title, message);
        
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .referenceType(refType)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAdmins(Notification.NotificationType type, Notification.ReferenceType refType, String title, String message, Long referenceId) {
        // --- HARD VALIDATION BEGIN ---
        if (message.toLowerCase().contains("ticket") && refType != Notification.ReferenceType.TICKET) {
            throw new IllegalStateException("Runtime Error: Admin Notification refType mismatch! Message contains 'ticket' but refType is " + refType);
        }
        if (message.toLowerCase().contains("pending") && type == Notification.NotificationType.BOOKING_APPROVED) {
            throw new IllegalStateException("Runtime Error: Admin Notification type mismatch! Message contains 'pending' but type is BOOKING_APPROVED");
        }
        // --- HARD VALIDATION END ---

        log.info("Creating admin notifications: type={}, refType={}, title={}, message={}", type, refType, title, message);
        
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        List<Notification> notifications = admins.stream().map(admin -> Notification.builder()
                .user(admin)
                .type(type)
                .referenceType(refType)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .isRead(false)
                .build()).collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
    }



    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this notification");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for User ID: {}", userId);
        notificationRepository.markAllAsReadForUser(userId);
    }

    private NotificationResponseDTO mapToDTO(Notification notification) {
        NotificationResponseDTO.NotificationResponseDTOBuilder builder = NotificationResponseDTO.builder()
                .id(notification.getId())
                .type(notification.getType())
                .referenceType(notification.getReferenceType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt());

        if (notification.getUser() != null) {
            builder.userId(notification.getUser().getId());
        }

        return builder.build();
    }
}
