package com.skillswap.controller;

import com.skillswap.dto.request.ConnectionRequestDto;
import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.ConnectionDto;
import com.skillswap.enums.ConnectionStatus;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.ConnectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/connections")
@Tag(name = "Connections", description = "Peer-to-Peer Swap Requests and Collaborations")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @GetMapping
    @Operation(summary = "List all connections (active and history)")
    public ResponseEntity<ApiResponse<List<ConnectionDto>>> getUserConnections(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ConnectionDto> connections = connectionService.getUserConnections(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(connections));
    }

    @GetMapping("/pending")
    @Operation(summary = "List received pending swap invitations")
    public ResponseEntity<ApiResponse<List<ConnectionDto>>> getPendingRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ConnectionDto> pending = connectionService.getPendingRequests(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    @PostMapping
    @Operation(summary = "Send a new skill swap request to a campus peer")
    public ResponseEntity<ApiResponse<ConnectionDto>> sendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ConnectionRequestDto request) {
        ConnectionDto created = connectionService.sendRequest(principal.getId(), request);
        return new ResponseEntity<>(ApiResponse.success(created, "Swap request sent"), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/accept")
    @Operation(summary = "Accept an incoming skill swap invitation")
    public ResponseEntity<ApiResponse<ConnectionDto>> acceptConnection(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ConnectionDto updated = connectionService.updateStatus(id, principal.getId(), ConnectionStatus.ACCEPTED);
        return ResponseEntity.ok(ApiResponse.success(updated, "Connection accepted"));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Decline an incoming skill swap invitation")
    public ResponseEntity<ApiResponse<ConnectionDto>> rejectConnection(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ConnectionDto updated = connectionService.updateStatus(id, principal.getId(), ConnectionStatus.REJECTED);
        return ResponseEntity.ok(ApiResponse.success(updated, "Connection rejected"));
    }
}
