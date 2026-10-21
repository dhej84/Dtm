package com.skillswap.matching;

import com.skillswap.dto.response.SkillRecommendationDto;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;

import java.util.List;

/**
 * Pluggable strategy interface for next skill suggestions.
 * Suggests campus skills that complement existing abilities or align with learning paths.
 */
public interface SkillRecommendationStrategy {

    /**
     * Recommends skills that may be beneficial for the student to learn next.
     *
     * @param student The active student
     * @param existingSkills The student's current skills (both TEACH and LEARN)
     * @param limit Maximum number of skills to recommend
     * @return Ordered list of recommended skills with explanatory reasons
     */
    List<SkillRecommendationDto> recommendSkills(User student,
                                                 List<UserSkill> existingSkills,
                                                 int limit);
}
