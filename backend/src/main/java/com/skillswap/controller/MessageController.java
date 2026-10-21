package com.skillswap.controller;

import com.skillswap.dto.request.ReportUserRequest;
import com.skillswap.dto.request.SendMessageRequest;
import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.MessageDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/messages")
@Tag(name = "Messages", description = "Direct Mentor-Learner Text Messages and Moderation")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    @Operation(summary = "Send a message with optional lesson context and NLP analysis")
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        MessageDto sent = messageService.sendMessage(userPrincipal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(sent, "Message sent"));
    }

    @PostMapping("/block")
    @Operation(summary = "Block a peer user from messaging")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @RequestParam String targetUserId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        messageService.blockUser(userPrincipal.getId(), targetUserId, reason);
        return ResponseEntity.ok(ApiResponse.success(null, "User blocked successfully"));
    }

    @DeleteMapping("/block")
    @Operation(summary = "Unblock a peer user")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @RequestParam String targetUserId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        messageService.unblockUser(userPrincipal.getId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success(null, "User unblocked successfully"));
    }

    @PostMapping("/report")
    @Operation(summary = "Report a user or conversation for moderation review")
    public ResponseEntity<ApiResponse<Void>> reportUser(
            @Valid @RequestBody ReportUserRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        messageService.reportUser(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Report submitted successfully"));
    }
}
