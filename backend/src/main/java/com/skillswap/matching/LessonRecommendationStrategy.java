package com.skillswap.matching;

import com.skillswap.dto.response.LessonRecommendationDto;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;

import java.util.List;
import java.util.Set;

/**
 * Pluggable strategy interface for lesson recommendations.
 * Supports rule-based heuristics, collaborative filtering, or future embedding search.
 */
public interface LessonRecommendationStrategy {

    /**
     * Recommends relevant peer workshops and lessons aligned with student goals.
     *
     * @param student The active student requesting lesson recommendations
     * @param learningSkills Skills the student wants to learn (skillType = LEARN)
     * @param completedLessonIds IDs of lessons the student has already completed
     * @param includeCompleted Whether to include already completed lessons
     * @param limit Maximum number of lesson recommendations to return
     * @return Ordered list of lesson recommendations with transparent reasons
     */
    List<LessonRecommendationDto> recommendLessons(User student,
                                                   List<UserSkill> learningSkills,
                                                   Set<String> completedLessonIds,
                                                   boolean includeCompleted,
                                                   int limit);
}
