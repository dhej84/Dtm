package com.skillswap.matching.impl;

import com.skillswap.dto.response.LessonDto;
import com.skillswap.dto.response.LessonRecommendationDto;
import com.skillswap.entity.Lesson;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;
import com.skillswap.enums.SkillLevel;
import com.skillswap.matching.LessonRecommendationStrategy;
import com.skillswap.repository.LessonRepository;
import com.skillswap.service.LessonService;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Deterministic, explainable lesson recommendation strategy.
 * Evaluates candidate peer lessons and workshops against student learning targets,
 * proficiency level alignment, and existing completion history.
 */
@Component
public class RuleBasedLessonRecommendationStrategy implements LessonRecommendationStrategy {

    private final LessonRepository lessonRepository;
    private final LessonService lessonService;

    public RuleBasedLessonRecommendationStrategy(LessonRepository lessonRepository,
                                                LessonService lessonService) {
        this.lessonRepository = lessonRepository;
        this.lessonService = lessonService;
    }

    @Override
    public List<LessonRecommendationDto> recommendLessons(User student,
                                                          List<UserSkill> learningSkills,
                                                          Set<String> completedLessonIds,
                                                          boolean includeCompleted,
                                                          int limit) {
        if (student == null) {
            return Collections.emptyList();
        }

        Set<String> completedIds = completedLessonIds != null ? completedLessonIds : Collections.emptySet();

        // Map learning skills by normalized name
        Map<String, UserSkill> learningSkillMap = (learningSkills == null) ? Collections.emptyMap() :
                learningSkills.stream()
                        .filter(s -> s.getName() != null && !s.getName().isBlank())
                        .collect(Collectors.toMap(
                                s -> s.getName().trim().toLowerCase(),
                                s -> s,
                                (s1, s2) -> s1
                        ));

        // Categories student is interested in
        Set<String> learningCategories = (learningSkills == null) ? Collections.emptySet() :
                learningSkills.stream()
                        .filter(s -> s.getCategory() != null && !s.getCategory().isBlank())
                        .map(s -> s.getCategory().trim().toLowerCase())
                        .collect(Collectors.toSet());

        // Fetch lessons taught by other peers
        List<Lesson> candidateLessons = lessonRepository.findByTeacherIdNot(student.getId());

        List<LessonRecommendationDto> recommendations = new ArrayList<>();

        for (Lesson lesson : candidateLessons) {
            // Filter out completed lessons unless explicitly requested
            if (!includeCompleted && completedIds.contains(lesson.getId())) {
                continue;
            }

            double score = 0.0;
            List<String> reasons = new ArrayList<>();
            String relevantSkill = lesson.getSkill();
            String normalizedLessonSkill = relevantSkill != null ? relevantSkill.trim().toLowerCase() : "";

            UserSkill matchedLearningSkill = learningSkillMap.get(normalizedLessonSkill);

            // 1. Skill Matching Factor (up to 50 pts)
            if (matchedLearningSkill != null) {
                score += 50.0;
                reasons.add("Covers " + lesson.getSkill() + ", which matches a skill you want to learn.");
            } else if (lesson.getCategory() != null && learningCategories.contains(lesson.getCategory().trim().toLowerCase())) {
                score += 25.0;
                reasons.add("Relevant to your focus in the " + lesson.getCategory() + " field.");
            } else if (learningSkillMap.isEmpty()) {
                score += 20.0;
                reasons.add("Recommended popular campus lesson to explore new disciplines.");
            } else {
                score += 10.0;
                reasons.add("Broadens your peer learning portfolio with " + lesson.getSkill() + ".");
            }

            // 2. Skill Level Compatibility Factor (up to 25 pts)
            SkillLevel lessonLevel = lesson.getSkillLevel() != null ? lesson.getSkillLevel() : SkillLevel.Intermediate;
            if (matchedLearningSkill != null) {
                SkillLevel targetLevel = matchedLearningSkill.getTargetLevel() != null ?
                        matchedLearningSkill.getTargetLevel() : matchedLearningSkill.getSkillLevel();

                if (lessonLevel == targetLevel) {
                    score += 25.0;
                    reasons.add("Directly matches your target proficiency level (" + lessonLevel.name() + ").");
                } else if (lessonLevel == matchedLearningSkill.getSkillLevel()) {
                    score += 20.0;
                    reasons.add("Matches your current learning level (" + lessonLevel.name() + ").");
                } else if (lessonLevel.ordinal() <= targetLevel.ordinal()) {
                    score += 15.0;
                    reasons.add("Accessible prerequisite level (" + lessonLevel.name() + ") toward your target.");
                } else {
                    score += 8.0;
                    reasons.add("Challenging advanced session (" + lessonLevel.name() + ") to accelerate your goals.");
                }
            } else {
                score += 15.0;
            }

            // 3. Social Proof & Engagement Factor (up to 15 pts)
            int enrolled = lesson.getEnrolledStudentsCount() != null ? lesson.getEnrolledStudentsCount() : 0;
            if (enrolled > 0) {
                double popularityBonus = Math.min(15.0, enrolled * 2.0);
                score += popularityBonus;
                reasons.add("Active peer engagement with " + enrolled + " enrolled student(s).");
            }

            // 4. University Affinity (up to 10 pts)
            if (lesson.getTeacher() != null && lesson.getTeacher().getUniversity() != null &&
                    student.getUniversity() != null &&
                    lesson.getTeacher().getUniversity().trim().equalsIgnoreCase(student.getUniversity().trim())) {
                score += 10.0;
                reasons.add("Taught by a peer from " + student.getUniversity() + ".");
            }

            double normalizedScore = Math.min(100.0, Math.round(score * 10.0) / 10.0);
            String primaryReason = String.join(" ", reasons);

            LessonDto lessonDto = lessonService.mapToDto(lesson);

            recommendations.add(new LessonRecommendationDto(
                    lessonDto,
                    relevantSkill,
                    lessonLevel.name(),
                    normalizedScore,
                    primaryReason
            ));
        }

        // Sort descending by recommendationScore
        recommendations.sort((a, b) -> Double.compare(b.getRecommendationScore(), a.getRecommendationScore()));

        int finalLimit = limit > 0 ? Math.min(limit, recommendations.size()) : recommendations.size();
        return recommendations.subList(0, finalLimit);
    }
}
