package com.skillswap.service;

import com.skillswap.dto.request.ConnectionRequestDto;
import com.skillswap.dto.response.ConnectionDto;
import com.skillswap.entity.Connection;
import com.skillswap.entity.Notification;
import com.skillswap.entity.User;
import com.skillswap.enums.ConnectionStatus;
import com.skillswap.enums.NotificationType;
import com.skillswap.exception.BadRequestException;
import com.skillswap.exception.DuplicateResourceException;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.ConnectionRepository;
import com.skillswap.repository.NotificationRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final UserService userService;

    public ConnectionService(ConnectionRepository connectionRepository,
                             UserRepository userRepository,
                             NotificationRepository notificationRepository,
                             UserService userService) {
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    public ConnectionDto mapToDto(Connection connection) {
        if (connection == null) return null;
        ConnectionDto dto = new ConnectionDto();
        dto.setId(connection.getId());
        dto.setFromUser(userService.mapToDto(connection.getFromUser()));
        dto.setToUser(userService.mapToDto(connection.getToUser()));
        dto.setTeachSkill(connection.getTeachSkill());
        dto.setLearnSkill(connection.getLearnSkill());
        dto.setMessage(connection.getMessage());
        dto.setStatus(connection.getStatus() != null ? connection.getStatus().name() : "PENDING");
        dto.setCreatedAt(connection.getCreatedAt());
        dto.setUpdatedAt(connection.getUpdatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ConnectionDto> getUserConnections(String userId) {
        return connectionRepository.findAllUserConnections(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConnectionDto> getPendingRequests(String userId) {
        return connectionRepository.findPendingReceivedRequests(userId, ConnectionStatus.PENDING).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConnectionDto sendRequest(String fromUserId, ConnectionRequestDto request) {
        if (fromUserId.equals(request.getToUserId())) {
            throw new BadRequestException("You cannot send a connection request to yourself");
        }

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", fromUserId));
        User toUser = userRepository.findById(request.getToUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient user", "id", request.getToUserId()));

        connectionRepository.findBetweenUsers(fromUserId, request.getToUserId())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("A connection or request already exists between you and " + toUser.getName());
                });

        Connection connection = new Connection(fromUser, toUser, request.getTeachSkill(), request.getLearnSkill(), request.getMessage());
        Connection saved = connectionRepository.save(connection);

        // Create notification for recipient
        Notification notification = new Notification();
        notification.setUser(toUser);
        notification.setTitle("New Swap Request");
        notification.setMessage(fromUser.getName() + " wants to swap skills with you: " +
                (request.getTeachSkill() != null ? request.getTeachSkill() : "Peer Mentorship"));
        notification.setNotificationType(NotificationType.SWAP_REQUEST);
        notificationRepository.save(notification);

        return mapToDto(saved);
    }

    @Transactional
    public ConnectionDto updateStatus(String connectionId, String userId, ConnectionStatus status) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Connection", "id", connectionId));

        if (!connection.getToUser().getId().equals(userId)) {
            throw new BadRequestException("Only the recipient can respond to this connection request");
        }

        connection.setStatus(status);
        Connection updated = connectionRepository.save(connection);

        if (status == ConnectionStatus.ACCEPTED) {
            Notification notification = new Notification();
            notification.setUser(connection.getFromUser());
            notification.setTitle("Swap Request Accepted!");
            notification.setMessage(connection.getToUser().getName() + " accepted your skill exchange request.");
            notification.setNotificationType(NotificationType.SWAP_ACCEPTED);
            notificationRepository.save(notification);
        }

        return mapToDto(updated);
    }
}
