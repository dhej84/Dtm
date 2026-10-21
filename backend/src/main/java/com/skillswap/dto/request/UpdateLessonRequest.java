package com.skillswap.dto.request;

import com.skillswap.enums.LessonFormat;
import com.skillswap.enums.SkillLevel;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public class UpdateLessonRequest {

    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    private String skill;

    private String category;

    private String description;

    private SkillLevel skillLevel;

    private LessonFormat format;

    private Integer durationMinutes;

    private BigDecimal creditsRequired;

    private String prerequisites;

    private List<CreateLessonRequest.ModuleDto> modules;

    public UpdateLessonRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }

    public LessonFormat getFormat() { return format; }
    public void setFormat(LessonFormat format) { this.format = format; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public BigDecimal getCreditsRequired() { return creditsRequired; }
    public void setCreditsRequired(BigDecimal creditsRequired) { this.creditsRequired = creditsRequired; }

    public String getPrerequisites() { return prerequisites; }
    public void setPrerequisites(String prerequisites) { this.prerequisites = prerequisites; }

    public List<CreateLessonRequest.ModuleDto> getModules() { return modules; }
    public void setModules(List<CreateLessonRequest.ModuleDto> modules) { this.modules = modules; }
}
