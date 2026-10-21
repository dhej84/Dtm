package com.skillswap.controller;

import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.SkillDto;
import com.skillswap.service.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/skills")
@Tag(name = "Skills", description = "Explore and Search Campus Skill Catalog")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    @Operation(summary = "List and search skills in catalog")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getSkills(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {
        List<SkillDto> skills;
        if (category != null && !category.isBlank()) {
            skills = skillService.getSkillsByCategory(category.trim());
        } else if (query != null && !query.isBlank()) {
            skills = skillService.searchSkills(query.trim());
        } else {
            skills = skillService.getAllSkills();
        }
        return ResponseEntity.ok(ApiResponse.success(skills));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get skill details by ID")
    public ResponseEntity<ApiResponse<SkillDto>> getSkillById(@PathVariable String id) {
        SkillDto skill = skillService.getSkillById(id);
        return ResponseEntity.ok(ApiResponse.success(skill));
    }

    @PostMapping
    @Operation(summary = "Create a new catalog skill")
    public ResponseEntity<ApiResponse<SkillDto>> createSkill(@Valid @RequestBody SkillDto skillDto) {
        SkillDto created = skillService.createSkill(skillDto);
        return new ResponseEntity<>(ApiResponse.success(created, "Skill created"), HttpStatus.CREATED);
    }
}
