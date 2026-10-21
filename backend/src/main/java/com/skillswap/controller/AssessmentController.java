package com.skillswap.controller;

import com.skillswap.dto.request.LinkGoogleFormRequest;
import com.skillswap.dto.request.RecordIntegrityEventRequest;
import com.skillswap.dto.request.SubmitAssessmentRequest;
import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.AssessmentAttemptDto;
import com.skillswap.dto.response.AssessmentDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.AssessmentBackendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assessments")
@Tag(name = "Assessments", description = "Module Checkpoint Assessments and Transparent Integrity Tracking")
public class AssessmentController {

    private final AssessmentBackendService assessmentService;

    public AssessmentController(AssessmentBackendService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping("/module/{moduleId}")
    @Operation(summary = "Get assessment details for a completed module")
    public ResponseEntity<ApiResponse<AssessmentDto>> getAssessmentByModule(
            @PathVariable String moduleId) {
        AssessmentDto dto = assessmentService.getAssessmentByModule(moduleId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/{assessmentId}/start")
    @Operation(summary = "Start a new assessment attempt")
    public ResponseEntity<ApiResponse<AssessmentAttemptDto>> startAttempt(
            @PathVariable String assessmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AssessmentAttemptDto attempt = assessmentService.startAttempt(assessmentId, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(attempt, "Assessment started"));
    }

    @PostMapping("/attempts/{attemptId}/integrity-event")
    @Operation(summary = "Log a transparent technical integrity event (tab switch, window blur, network loss)")
    public ResponseEntity<ApiResponse<AssessmentAttemptDto>> recordIntegrityEvent(
            @PathVariable String attemptId,
            @Valid @RequestBody RecordIntegrityEventRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AssessmentAttemptDto attempt = assessmentService.recordIntegrityEvent(attemptId, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(attempt));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @Operation(summary = "Submit and evaluate assessment attempt")
    public ResponseEntity<ApiResponse<AssessmentAttemptDto>> submitAttempt(
            @PathVariable String attemptId,
            @RequestBody SubmitAssessmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AssessmentAttemptDto result = assessmentService.submitAttempt(attemptId, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(result, "Assessment submitted and evaluated"));
    }

    @PostMapping("/google-form")
    @Operation(summary = "Link an external Google Form assessment to a lesson module")
    public ResponseEntity<ApiResponse<AssessmentDto>> linkGoogleForm(
            @Valid @RequestBody LinkGoogleFormRequest request) {
        AssessmentDto assessment = assessmentService.linkGoogleForm(request);
        return ResponseEntity.ok(ApiResponse.success(assessment, "Google Form linked successfully"));
    }
}
