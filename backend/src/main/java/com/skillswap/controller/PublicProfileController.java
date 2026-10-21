package com.skillswap.controller;

import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.PublicProfileDto;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/public-profiles")
@Tag(name = "Public Profiles", description = "Public profile sharing and non-sensitive collegiate profiles")
public class PublicProfileController {

    private final UserService userService;

    public PublicProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{publicProfileId}")
    @Operation(summary = "Get privacy-safe public profile by opaque public identifier")
    public ResponseEntity<ApiResponse<PublicProfileDto>> getPublicProfile(
            @PathVariable String publicProfileId) {
        PublicProfileDto publicProfile = userService.getPublicProfile(publicProfileId);
        return ResponseEntity.ok(ApiResponse.success(publicProfile));
    }

    @PostMapping("/regenerate")
    @Operation(summary = "Regenerate unique public profile identifier for the authenticated student")
    public ResponseEntity<ApiResponse<Map<String, String>>> regeneratePublicProfileId(
            @AuthenticationPrincipal UserPrincipal principal) {
        String newPublicId = userService.regeneratePublicProfileId(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("publicProfileId", newPublicId), "Public profile link regenerated successfully"));
    }
}
