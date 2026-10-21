package com.skillswap.dto.request;

import com.skillswap.enums.LessonFormat;
import com.skillswap.enums.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public class CreateLessonRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Skill name is required")
    private String skill;

    private String category = "General";

    private String description;

    @NotNull(message = "Skill level is required")
    private SkillLevel skillLevel;

    private LessonFormat format = LessonFormat.INTERACTIVE_WORKSHOP;

    private Integer durationMinutes = 60;

    private BigDecimal creditsRequired = new BigDecimal("1.00");

    private String prerequisites;

    private List<ModuleDto> modules;

    public static class ModuleDto {
        private String title;
        private String duration;
        private Integer sequenceOrder;
        private String description;
        private String contentSnippet;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public Integer getSequenceOrder() { return sequenceOrder; }
        public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getContentSnippet() { return contentSnippet; }
        public void setContentSnippet(String contentSnippet) { this.contentSnippet = contentSnippet; }
    }

    public CreateLessonRequest() {}

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

    public List<ModuleDto> getModules() { return modules; }
    public void setModules(List<ModuleDto> modules) { this.modules = modules; }
}
