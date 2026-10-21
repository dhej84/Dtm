package com.skillswap.repository;

import com.skillswap.entity.LessonModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonModuleRepository extends JpaRepository<LessonModule, String> {
    List<LessonModule> findByLessonIdOrderBySequenceOrderAsc(String lessonId);
}
