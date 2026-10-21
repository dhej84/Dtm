package com.skillswap.repository;

import com.skillswap.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, String> {

    Optional<LessonProgress> findByLessonIdAndUserId(String lessonId, String userId);

    List<LessonProgress> findByUserId(String userId);

    long countByUserId(String userId);

    long countByUserIdAndIsCompletedTrue(String userId);

    List<LessonProgress> findByUserIdAndIsCompletedTrue(String userId);
}
