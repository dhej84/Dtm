package com.skillswap.service;

import com.skillswap.dto.request.AddCommentRequest;
import com.skillswap.dto.response.CommentDto;
import com.skillswap.entity.Comment;
import com.skillswap.entity.CommentLike;
import com.skillswap.entity.Lesson;
import com.skillswap.entity.User;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.CommentLikeRepository;
import com.skillswap.repository.CommentRepository;
import com.skillswap.repository.LessonRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public CommentService(CommentRepository commentRepository,
                          CommentLikeRepository commentLikeRepository,
                          LessonRepository lessonRepository,
                          UserRepository userRepository,
                          UserService userService) {
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public CommentDto mapToDto(Comment comment, String currentUserId) {
        if (comment == null) return null;
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setLessonId(comment.getLesson().getId());
        dto.setAuthor(userService.mapToDto(comment.getAuthor()));
        dto.setText(comment.getText());
        dto.setLikes(comment.getLikes() != null ? comment.getLikes() : 0);
        dto.setLikedByCurrentUser(currentUserId != null &&
                commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId));
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByLesson(String lessonId, String currentUserId) {
        return commentRepository.findByLessonIdOrderByCreatedAtDesc(lessonId).stream()
                .map(c -> mapToDto(c, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto addComment(String lessonId, String authorId, AddCommentRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", authorId));

        Comment comment = new Comment(lesson, author, request.getText().trim());
        Comment saved = commentRepository.save(comment);

        return mapToDto(saved, authorId);
    }

    @Transactional
    public CommentDto toggleLike(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Optional<CommentLike> existingLike = commentLikeRepository.findByCommentIdAndUserId(commentId, userId);

        if (existingLike.isPresent()) {
            commentLikeRepository.delete(existingLike.get());
            comment.setLikes(Math.max(0, (comment.getLikes() != null ? comment.getLikes() : 1) - 1));
        } else {
            CommentLike newLike = new CommentLike(comment, user);
            commentLikeRepository.save(newLike);
            comment.setLikes((comment.getLikes() != null ? comment.getLikes() : 0) + 1);
        }

        comment.setUpdatedAt(Instant.now());
        Comment updated = commentRepository.save(comment);
        return mapToDto(updated, userId);
    }

    @Transactional
    public void deleteComment(String commentId, String currentUserId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getAuthor().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to delete another user's comment");
        }

        // Remove any associated likes first
        commentLikeRepository.deleteByCommentId(commentId);
        commentRepository.delete(comment);
    }
}
