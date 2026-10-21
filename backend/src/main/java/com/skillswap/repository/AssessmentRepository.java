package com.skillswap.repository;

import com.skillswap.entity.AssessmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<AssessmentEntity, String> {

    Optional<AssessmentEntity> findByModuleId(String moduleId);

    List<AssessmentEntity> findByLessonId(String lessonId);
}
