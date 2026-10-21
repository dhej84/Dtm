package com.skillswap.controller;

import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.LessonRecommendationDto;
import com.skillswap.dto.response.SkillGapDto;
import com.skillswap.dto.response.StudentRecommendationDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommendations")
@Tag(name = "Recommendations", description = "Deterministic, Explainable Mentor, Learner, and Lesson Matching")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/mentors")
    @Operation(summary = "Get personalized recommended mentors based on learning goals and context")
    public ResponseEntity<ApiResponse<List<StudentRecommendationDto>>> getRecommendedMentors(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<StudentRecommendationDto> mentors = recommendationService.getRecommendedMentors(
                userPrincipal.getId(), skill, level, language, limit);
        return ResponseEntity.ok(ApiResponse.success(mentors));
    }

    @GetMapping("/learners")
    @Operation(summary = "Get recommended students seeking to learn skills taught by current user")
    public ResponseEntity<ApiResponse<List<StudentRecommendationDto>>> getRecommendedLearners(
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<StudentRecommendationDto> learners = recommendationService.getRecommendedLearners(
                userPrincipal.getId(), limit);
        return ResponseEntity.ok(ApiResponse.success(learners));
    }

    @GetMapping("/lessons")
    @Operation(summary = "Get recommended lessons avoiding completed ones and matching active gaps")
    public ResponseEntity<ApiResponse<List<LessonRecommendationDto>>> getRecommendedLessons(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "false") boolean includeCompleted,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<LessonRecommendationDto> lessons = recommendationService.getRecommendedLessons(
                userPrincipal.getId(), category, level, includeCompleted, limit);
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/skill-gaps")
    @Operation(summary = "Detect curriculum skill gaps between target goals and current progress")
    public ResponseEntity<ApiResponse<List<SkillGapDto>>> getSkillGaps(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<SkillGapDto> gaps = recommendationService.getSkillGaps(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(gaps));
    }

    @GetMapping("/explanation/{candidateId}")
    @Operation(summary = "Get transparent matching factor breakdown for a specific candidate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMatchExplanation(
            @PathVariable String candidateId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Map<String, Object> explanation = recommendationService.getMatchExplanation(
                userPrincipal.getId(), candidateId);
        return ResponseEntity.ok(ApiResponse.success(explanation));
    }
}
