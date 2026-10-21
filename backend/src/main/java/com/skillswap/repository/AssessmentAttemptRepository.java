package com.skillswap.repository;

import com.skillswap.entity.AssessmentAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttemptEntity, String> {

    List<AssessmentAttemptEntity> findByAssessmentIdAndUserIdOrderByStartTimeDesc(String assessmentId, String userId);

    List<AssessmentAttemptEntity> findByUserIdOrderByStartTimeDesc(String userId);

    Optional<AssessmentAttemptEntity> findTopByAssessmentIdAndUserIdOrderByScoreDesc(String assessmentId, String userId);
}
