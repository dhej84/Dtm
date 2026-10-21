package com.skillswap.matching;

import com.skillswap.dto.response.StudentRecommendationDto;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;

import java.util.List;

/**
 * Pluggable strategy interface for student peer matching.
 * Allows switching between deterministic rule-based algorithms,
 * embedding-based vector similarity, and LLM-driven matchmakers without
 * altering controllers or domain services.
 */
public interface StudentMatchingStrategy {

    /**
     * Finds and scores recommended peer students who teach skills the student wants to learn.
     *
     * @param student The active student requesting matches
     * @param learningSkills Skills the student wants to learn (skillType = LEARN)
     * @param teachingSkills Skills the student can teach (skillType = TEACH)
     * @param limit Maximum number of candidate recommendations to return
     * @return Ordered list of student recommendations with explainable scores and reasons
     */
    List<StudentRecommendationDto> matchStudents(User student,
                                                 List<UserSkill> learningSkills,
                                                 List<UserSkill> teachingSkills,
                                                 int limit);
}
