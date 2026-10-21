package com.skillswap.controller;

import com.skillswap.dto.request.AddSkillRequest;
import com.skillswap.dto.request.PrivacySettingsDto;
import com.skillswap.dto.request.ProfileUpdateRequest;
import com.skillswap.dto.request.UpdateSkillLevelRequest;
import com.skillswap.dto.response.*;
import com.skillswap.entity.UserSkill;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/profile")
@Tag(name = "Profile", description = "Student Profile, Skills, and Privacy Settings")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get current authenticated user complete profile")
    public ResponseEntity<ApiResponse<ProfileDto>> getCurrentProfile(@AuthenticationPrincipal UserPrincipal principal) {
        ProfileDto profileDto = userService.getProfileByUserId(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(profileDto));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get any student public profile by ID")
    public ResponseEntity<ApiResponse<ProfileDto>> getProfileByUserId(@PathVariable String userId) {
        ProfileDto profileDto = userService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(profileDto));
    }

    @PutMapping
    @Operation(summary = "Update current user profile bio, location, visibility settings")
    public ResponseEntity<ApiResponse<ProfileDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProfileUpdateRequest request) {
        ProfileDto updated = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @PatchMapping("/privacy")
    @Operation(summary = "Update privacy and peer exchange visibility settings")
    public ResponseEntity<ApiResponse<ProfileDto>> updatePrivacySettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PrivacySettingsDto request) {
        ProfileDto updated = userService.updatePrivacySettings(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Privacy settings updated"));
    }

    @GetMapping("/teaching-skills")
    @Operation(summary = "Get skills user teaches")
    public ResponseEntity<ApiResponse<List<TeachingSkillDto>>> getTeachingSkills(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TeachingSkillDto> skills = userService.getTeachingSkills(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(skills));
    }

    @GetMapping("/learning-skills")
    @Operation(summary = "Get skills user is actively learning")
    public ResponseEntity<ApiResponse<List<LearningSkillDto>>> getLearningSkills(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<LearningSkillDto> skills = userService.getLearningSkills(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(skills));
    }

    @PostMapping("/skills")
    @Operation(summary = "Add a teaching or learning skill to profile")
    public ResponseEntity<ApiResponse<UserSkill>> addSkill(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddSkillRequest request) {
        UserSkill skill = userService.addUserSkill(principal.getId(), request);
        return new ResponseEntity<>(ApiResponse.success(skill, "Skill added to profile"), HttpStatus.CREATED);
    }

    @PutMapping("/skills/{skillId}")
    @Operation(summary = "Update skill level and proficiency on profile")
    public ResponseEntity<ApiResponse<UserSkill>> updateSkillLevel(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String skillId,
            @Valid @RequestBody UpdateSkillLevelRequest request) {
        UserSkill updated = userService.updateUserSkillLevel(principal.getId(), skillId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Skill level updated successfully"));
    }

    @DeleteMapping("/skills/{skillId}")
    @Operation(summary = "Remove a skill from profile")
    public ResponseEntity<ApiResponse<Void>> removeSkill(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String skillId) {
        userService.removeUserSkill(principal.getId(), skillId);
        return ResponseEntity.ok(ApiResponse.success(null, "Skill removed successfully"));
    }

    @GetMapping("/achievements")
    @Operation(summary = "Get current user earned badges and achievements")
    public ResponseEntity<ApiResponse<List<AchievementDto>>> getAchievements(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AchievementDto> achievements = userService.getUserAchievements(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(achievements));
    }
}
