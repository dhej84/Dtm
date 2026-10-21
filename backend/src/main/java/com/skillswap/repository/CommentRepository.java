package com.skillswap.repository;

import com.skillswap.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByLessonIdOrderByCreatedAtDesc(String lessonId);
}
