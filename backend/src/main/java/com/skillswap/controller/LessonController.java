package com.skillswap.controller;

import com.skillswap.dto.request.CreateLessonRequest;
import com.skillswap.dto.request.UpdateLessonRequest;
import com.skillswap.dto.request.UpdateProgressRequest;
import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.LessonDetailDto;
import com.skillswap.dto.response.LessonDto;
import com.skillswap.dto.response.LessonProgressDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.FileStorageService;
import com.skillswap.service.LessonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lessons")
@Tag(name = "Lessons", description = "Workshops, Tutoring Sessions, Modules, and Progress Tracking")
public class LessonController {

    private final LessonService lessonService;
    private final FileStorageService fileStorageService;

    public LessonController(LessonService lessonService, FileStorageService fileStorageService) {
        this.lessonService = lessonService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    @Operation(summary = "Search and filter peer lessons and workshops")
    public ResponseEntity<ApiResponse<List<LessonDto>>> getLessons(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String skillLevel,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String teacherId) {
        List<LessonDto> lessons = lessonService.getAllLessons(query, category, skillLevel, skill, teacherId);
        return ResponseEntity.ok(ApiResponse.success(lessons));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lesson details including curriculum modules and resources")
    public ResponseEntity<ApiResponse<LessonDetailDto>> getLessonDetail(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String userId = principal != null ? principal.getId() : null;
        LessonDetailDto lesson = lessonService.getLessonDetail(id, userId);
        return ResponseEntity.ok(ApiResponse.success(lesson));
    }

    @PostMapping
    @Operation(summary = "Create and publish a new workshop or lesson")
    public ResponseEntity<ApiResponse<LessonDto>> createLesson(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLessonRequest request) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        LessonDto created = lessonService.createLesson(principal.getId(), request);
        return new ResponseEntity<>(ApiResponse.success(created, "Lesson created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing lesson")
    public ResponseEntity<ApiResponse<LessonDto>> updateLesson(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateLessonRequest request) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        LessonDto updated = lessonService.updateLesson(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Lesson updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an existing lesson")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        lessonService.deleteLesson(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Lesson deleted successfully"));
    }

    @PostMapping("/{id}/enroll")
    @Operation(summary = "Enroll in a workshop and start progress tracking")
    public ResponseEntity<ApiResponse<LessonProgressDto>> enrollInLesson(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        LessonProgressDto progress = lessonService.enrollInLesson(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(progress, "Enrolled in lesson"));
    }

    @GetMapping("/{id}/progress")
    @Operation(summary = "Get current student progress for a lesson")
    public ResponseEntity<ApiResponse<LessonProgressDto>> getLessonProgress(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        LessonProgressDto progress = lessonService.getProgress(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @PutMapping("/{id}/progress")
    @Operation(summary = "Update module completion, notes, and progress percentage")
    public ResponseEntity<ApiResponse<LessonProgressDto>> updateProgress(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProgressRequest request) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        LessonProgressDto updated = lessonService.updateProgress(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Progress updated"));
    }

    @GetMapping("/user/progress")
    @Operation(summary = "Get all enrolled lessons and progress records for current user")
    public ResponseEntity<ApiResponse<List<LessonProgressDto>>> getAllUserProgress(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }
        List<LessonProgressDto> list = lessonService.getAllUserProgress(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping(value = "/{id}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and attach an authentic video to a lesson")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadLessonVideo(
            @PathVariable String id,
            @RequestParam(value = "video", required = false) MultipartFile videoParam,
            @RequestParam(value = "file", required = false) MultipartFile fileParam,
            @RequestParam(value = "duration", required = false) String duration,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }

        MultipartFile file = videoParam != null ? videoParam : fileParam;
        if (file == null || file.isEmpty()) {
            return new ResponseEntity<>(ApiResponse.error("No video file received in request", HttpStatus.BAD_REQUEST.value()), HttpStatus.BAD_REQUEST);
        }

        // Validate video MIME and extension
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        boolean isValidVideo = contentType != null && contentType.startsWith("video/");
        if (!isValidVideo && originalFilename != null) {
            String lower = originalFilename.toLowerCase();
            isValidVideo = lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") || lower.endsWith(".ogg");
        }
        if (!isValidVideo) {
            return new ResponseEntity<>(ApiResponse.error("Invalid video format. Allowed formats: MP4, WebM, MOV", HttpStatus.BAD_REQUEST.value()), HttpStatus.BAD_REQUEST);
        }

        // Validate size (max 500MB)
        if (file.getSize() > 500L * 1024 * 1024) {
            return new ResponseEntity<>(ApiResponse.error("Video file exceeds the 500MB limit", HttpStatus.BAD_REQUEST.value()), HttpStatus.BAD_REQUEST);
        }

        // Store video file safely using the existing storage service
        String storedFileName = fileStorageService.storeFile(file);
        String videoUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/files/")
                .path(storedFileName)
                .toUriString();

        // Update lesson video metadata in database
        UpdateLessonRequest updateReq = new UpdateLessonRequest();
        updateReq.setVideoUrl(videoUrl);
        lessonService.updateLesson(id, principal.getId(), updateReq);

        Map<String, String> responseData = new HashMap<>();
        responseData.put("videoId", "vid-" + System.currentTimeMillis());
        responseData.put("lessonId", id);
        responseData.put("videoUrl", videoUrl);
        responseData.put("fileName", originalFilename != null ? originalFilename : storedFileName);
        responseData.put("fileSize", String.valueOf(file.getSize()));
        responseData.put("mimeType", contentType != null ? contentType : "video/mp4");
        responseData.put("duration", duration != null ? duration : "00:00");
        responseData.put("storageKey", storedFileName);

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lesson video attached successfully"));
    }

    @GetMapping("/{id}/video")
    @Operation(summary = "Get video metadata for a lesson")
    public ResponseEntity<ApiResponse<Map<String, String>>> getLessonVideo(@PathVariable String id) {
        LessonDetailDto lesson = lessonService.getLessonDetail(id, null);
        if (lesson == null || lesson.getVideoUrl() == null || lesson.getVideoUrl().isEmpty()) {
            return new ResponseEntity<>(ApiResponse.error("No video attached to this lesson", HttpStatus.NOT_FOUND.value()), HttpStatus.NOT_FOUND);
        }

        Map<String, String> data = new HashMap<>();
        data.put("lessonId", id);
        data.put("videoUrl", lesson.getVideoUrl());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @DeleteMapping("/{id}/video")
    @Operation(summary = "Remove video from a lesson")
    public ResponseEntity<ApiResponse<Void>> deleteLessonVideo(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthenticated", HttpStatus.UNAUTHORIZED.value()), HttpStatus.UNAUTHORIZED);
        }

        UpdateLessonRequest updateReq = new UpdateLessonRequest();
        updateReq.setVideoUrl("");
        lessonService.updateLesson(id, principal.getId(), updateReq);

        return ResponseEntity.ok(ApiResponse.success(null, "Lesson video removed successfully"));
    }
}
