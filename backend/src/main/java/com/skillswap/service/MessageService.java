package com.skillswap.service;

import com.skillswap.dto.request.ReportUserRequest;
import com.skillswap.dto.request.SendMessageRequest;
import com.skillswap.dto.response.ConversationDto;
import com.skillswap.dto.response.MessageDto;
import com.skillswap.entity.*;
import com.skillswap.enums.MessageStatus;
import com.skillswap.exception.BadRequestException;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final MessageReportRepository messageReportRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final NlpAssistantService nlpAssistantService;

    public MessageService(ConversationRepository conversationRepository,
                          MessageRepository messageRepository,
                          BlockedUserRepository blockedUserRepository,
                          MessageReportRepository messageReportRepository,
                          UserRepository userRepository,
                          LessonRepository lessonRepository,
                          NlpAssistantService nlpAssistantService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.blockedUserRepository = blockedUserRepository;
        this.messageReportRepository = messageReportRepository;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.nlpAssistantService = nlpAssistantService;
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(String currentUserId) {
        List<Conversation> convs = conversationRepository.findUserConversations(currentUserId);
        List<BlockedUser> blocked = blockedUserRepository.findByBlockerId(currentUserId);
        List<String> blockedUserIds = blocked.stream()
                .map(b -> b.getBlocked().getId())
                .collect(Collectors.toList());

        return convs.stream()
                .filter(c -> {
                    String partnerId = c.getParticipant1().getId().equals(currentUserId)
                            ? c.getParticipant2().getId() : c.getParticipant1().getId();
                    return !blockedUserIds.contains(partnerId);
                })
                .map(c -> mapToConversationDto(c, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<MessageDto> getConversationMessages(String conversationId, String currentUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        validateParticipant(conversation, currentUserId);

        // Mark incoming messages as READ
        messageRepository.markConversationMessagesAsRead(conversationId, currentUserId, MessageStatus.READ);

        // Reset unread count for viewer
        if (conversation.getParticipant1().getId().equals(currentUserId)) {
            conversation.setUnreadCountUser1(0);
        } else {
            conversation.setUnreadCountUser2(0);
        }
        conversationRepository.save(conversation);

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return messages.stream().map(this::mapToMessageDto).collect(Collectors.toList());
    }

    @Transactional
    public MessageDto sendMessage(String currentUserId, SendMessageRequest request) {
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BadRequestException("Message content cannot be blank");
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", request.getConversationId()));

        validateParticipant(conversation, currentUserId);

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        String recipientId = conversation.getParticipant1().getId().equals(currentUserId)
                ? conversation.getParticipant2().getId() : conversation.getParticipant1().getId();

        // Check if either participant has blocked the other
        if (blockedUserRepository.existsByBlockerIdAndBlockedId(currentUserId, recipientId) ||
            blockedUserRepository.existsByBlockerIdAndBlockedId(recipientId, currentUserId)) {
            throw new BadRequestException("Communication is blocked between these users");
        }

        Lesson referencedLesson = null;
        if (request.getReferencedLessonId() != null && !request.getReferencedLessonId().isBlank()) {
            referencedLesson = lessonRepository.findById(request.getReferencedLessonId()).orElse(null);
        }

        // NLP Analysis for language, intent, and translation assistance
        NlpAssistantService.NlpAnalysisResult nlpResult = nlpAssistantService.analyze(request.getContent());

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent().trim());
        message.setStatus(MessageStatus.DELIVERED); // Mark DELIVERED upon server receipt
        message.setReferencedLesson(referencedLesson);
        message.setReferencedModuleId(request.getReferencedModuleId());
        message.setDetectedLanguage(nlpResult.getDetectedLanguage());
        message.setDetectedIntent(nlpResult.getIntent());
        message.setEnglishTranslation(nlpResult.getEnglishTranslation());

        Message savedMessage = messageRepository.save(message);

        // Update conversation summary
        conversation.setLastMessageContent(savedMessage.getContent());
        conversation.setLastMessageAt(Instant.now());
        if (referencedLesson != null) {
            conversation.setActiveLesson(referencedLesson);
            conversation.setReferencedModuleId(request.getReferencedModuleId());
        }

        if (conversation.getParticipant1().getId().equals(currentUserId)) {
            conversation.setUnreadCountUser2(conversation.getUnreadCountUser2() + 1);
        } else {
            conversation.setUnreadCountUser1(conversation.getUnreadCountUser1() + 1);
        }
        conversationRepository.save(conversation);

        return mapToMessageDto(savedMessage);
    }

    @Transactional
    public ConversationDto startOrGetConversation(String currentUserId, String targetUserId, String initialLessonId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException("Cannot create a conversation with yourself");
        }

        User u1 = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User u2 = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        Conversation conversation = conversationRepository.findBetweenUsers(currentUserId, targetUserId)
                .orElseGet(() -> {
                    Conversation c = new Conversation(u1, u2);
                    return conversationRepository.save(c);
                });

        if (initialLessonId != null && !initialLessonId.isBlank()) {
            lessonRepository.findById(initialLessonId).ifPresent(conversation::setActiveLesson);
            conversationRepository.save(conversation);
        }

        return mapToConversationDto(conversation, currentUserId);
    }

    @Transactional
    public void blockUser(String currentUserId, String targetUserId, String reason) {
        if (currentUserId.equals(targetUserId)) {
            throw new BadRequestException("Cannot block yourself");
        }
        User blocker = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User blocked = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (!blockedUserRepository.existsByBlockerIdAndBlockedId(currentUserId, targetUserId)) {
            BlockedUser bu = new BlockedUser(blocker, blocked, reason);
            blockedUserRepository.save(bu);
        }
    }

    @Transactional
    public void unblockUser(String currentUserId, String targetUserId) {
        blockedUserRepository.deleteByBlockerIdAndBlockedId(currentUserId, targetUserId);
    }

    @Transactional
    public void reportUser(String currentUserId, ReportUserRequest request) {
        User reporter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User reported = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getReportedUserId()));

        Conversation conv = null;
        if (request.getConversationId() != null) {
            conv = conversationRepository.findById(request.getConversationId()).orElse(null);
        }

        MessageReport report = new MessageReport(reporter, reported, conv, request.getReason(), request.getDetails());
        messageReportRepository.save(report);
    }

    private void validateParticipant(Conversation conversation, String currentUserId) {
        boolean isP1 = conversation.getParticipant1().getId().equals(currentUserId);
        boolean isP2 = conversation.getParticipant2().getId().equals(currentUserId);
        if (!isP1 && !isP2) {
            throw new AccessDeniedException("You do not have access to this conversation");
        }
    }

    public MessageDto mapToMessageDto(Message m) {
        MessageDto dto = new MessageDto();
        dto.setId(m.getId());
        dto.setConversationId(m.getConversation().getId());
        dto.setSenderId(m.getSender().getId());
        dto.setSenderName(m.getSender().getName());
        dto.setSenderAvatar(m.getSender().getAvatarUrl());
        dto.setContent(m.getContent());
        dto.setStatus(m.getStatus().name());
        dto.setDetectedLanguage(m.getDetectedLanguage());
        dto.setDetectedIntent(m.getDetectedIntent());
        dto.setEnglishTranslation(m.getEnglishTranslation());
        dto.setReferencedModuleId(m.getReferencedModuleId());
        if (m.getReferencedLesson() != null) {
            dto.setReferencedLessonId(m.getReferencedLesson().getId());
            dto.setReferencedLessonTitle(m.getReferencedLesson().getTitle());
        }
        dto.setCreatedAt(m.getCreatedAt());
        return dto;
    }

    public ConversationDto mapToConversationDto(Conversation c, String currentUserId) {
        boolean isP1 = c.getParticipant1().getId().equals(currentUserId);
        User partner = isP1 ? c.getParticipant2() : c.getParticipant1();
        int unread = isP1 ? c.getUnreadCountUser1() : c.getUnreadCountUser2();

        ConversationDto dto = new ConversationDto();
        dto.setId(c.getId());
        dto.setPartnerId(partner.getId());
        dto.setPartnerName(partner.getName());
        dto.setPartnerAvatar(partner.getAvatarUrl());
        dto.setPartnerProgram(partner.getDepartment() != null ? partner.getDepartment() : "Campus Peer");
        dto.setPartnerRole("mentor");
        dto.setLastMessageContent(c.getLastMessageContent());
        dto.setLastMessageAt(c.getLastMessageAt());
        dto.setUnreadCount(unread);
        if (c.getActiveLesson() != null) {
            dto.setActiveLessonId(c.getActiveLesson().getId());
            dto.setActiveLessonTitle(c.getActiveLesson().getTitle());
        }
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }
}
