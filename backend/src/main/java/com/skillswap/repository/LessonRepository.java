package com.skillswap.repository;

import com.skillswap.entity.Lesson;
import com.skillswap.enums.SkillLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, String> {

    List<Lesson> findByTeacherId(String teacherId);

    List<Lesson> findBySkillIgnoreCase(String skill);

    List<Lesson> findBySkillLevel(SkillLevel skillLevel);

    List<Lesson> findByCategoryIgnoreCase(String category);

    @Query("SELECT l FROM Lesson l WHERE " +
           "(:query IS NULL OR LOWER(l.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.skill) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(l.teacher.name) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:skill IS NULL OR LOWER(l.skill) = LOWER(:skill)) AND " +
           "(:level IS NULL OR l.skillLevel = :level) AND " +
           "(:category IS NULL OR LOWER(l.category) = LOWER(:category)) " +
           "ORDER BY l.createdAt DESC")
    List<Lesson> filterLessons(@Param("query") String query,
                               @Param("skill") String skill,
                               @Param("level") SkillLevel level,
                               @Param("category") String category);

    List<Lesson> findByTeacherIdNot(String teacherId);

    long countBySkillIgnoreCase(String skill);
}
