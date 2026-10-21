package com.skillswap.repository;

import com.skillswap.entity.LessonResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonResourceRepository extends JpaRepository<LessonResource, String> {
    List<LessonResource> findByLessonId(String lessonId);
}
