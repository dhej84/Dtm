package com.skillswap.controller;

import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.ConversationDto;
import com.skillswap.dto.response.MessageDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/conversations")
@Tag(name = "Conversations", description = "Peer Mentor and Learner Private Messaging Channels")
public class ConversationController {

    private final MessageService messageService;

    public ConversationController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    @Operation(summary = "List current user conversations with unread counts")
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<ConversationDto> convs = messageService.getUserConversations(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(convs));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get conversation messages and mark as read")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getConversationMessages(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<MessageDto> messages = messageService.getConversationMessages(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/start")
    @Operation(summary = "Start or retrieve conversation with a peer mentor/learner")
    public ResponseEntity<ApiResponse<ConversationDto>> startConversation(
            @RequestParam String targetUserId,
            @RequestParam(required = false) String initialLessonId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ConversationDto conv = messageService.startOrGetConversation(userPrincipal.getId(), targetUserId, initialLessonId);
        return ResponseEntity.ok(ApiResponse.success(conv));
    }
}
