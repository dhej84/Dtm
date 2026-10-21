package com.skillswap.controller;

import com.skillswap.dto.request.AddCommentRequest;
import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.CommentDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Tag(name = "Comments", description = "Lesson Discussions and Peer Feedback")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/lessons/{lessonId}/comments")
    @Operation(summary = "Get comments thread for a lesson")
    public ResponseEntity<ApiResponse<List<CommentDto>>> getComments(
            @PathVariable String lessonId,
            @AuthenticationPrincipal UserPrincipal principal) {
        String userId = principal != null ? principal.getId() : null;
        List<CommentDto> comments = commentService.getCommentsByLesson(lessonId, userId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @PostMapping("/lessons/{lessonId}/comments")
    @Operation(summary = "Post a comment on a lesson")
    public ResponseEntity<ApiResponse<CommentDto>> addComment(
            @PathVariable String lessonId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddCommentRequest request) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        CommentDto created = commentService.addComment(lessonId, principal.getId(), request);
        return new ResponseEntity<>(ApiResponse.success(created, "Comment posted"), HttpStatus.CREATED);
    }

    @PostMapping("/comments/{commentId}/like")
    @Operation(summary = "Toggle helpful like on a comment")
    public ResponseEntity<ApiResponse<CommentDto>> toggleLike(
            @PathVariable String commentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        CommentDto updated = commentService.toggleLike(commentId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(updated, "Like status updated"));
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete comment (author only)")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        commentService.deleteComment(commentId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Comment deleted successfully"));
    }
}
