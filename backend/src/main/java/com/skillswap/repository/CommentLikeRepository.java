package com.skillswap.repository;

import com.skillswap.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, String> {
    Optional<CommentLike> findByCommentIdAndUserId(String commentId, String userId);
    boolean existsByCommentIdAndUserId(String commentId, String userId);
    void deleteByCommentId(String commentId);
}
