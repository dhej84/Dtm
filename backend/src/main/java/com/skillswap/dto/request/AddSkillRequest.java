package com.skillswap.dto.request;

import com.skillswap.enums.SkillLevel;
import com.skillswap.enums.SkillType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AddSkillRequest {

    @NotBlank(message = "Skill name is required")
    @Size(max = 150, message = "Skill name cannot exceed 150 characters")
    private String name;

    private String category = "General";

    @NotNull(message = "Skill type (TEACH or LEARN) is required")
    private SkillType skillType;

    @NotNull(message = "Skill level is required")
    private SkillLevel skillLevel;

    private SkillLevel targetLevel;

    private Integer proficiencyPercent;

    private String description;

    private String targetDate;

    public AddSkillRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public SkillType getSkillType() { return skillType; }
    public void setSkillType(SkillType skillType) { this.skillType = skillType; }

    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }

    public SkillLevel getTargetLevel() { return targetLevel; }
    public void setTargetLevel(SkillLevel targetLevel) { this.targetLevel = targetLevel; }

    public Integer getProficiencyPercent() { return proficiencyPercent; }
    public void setProficiencyPercent(Integer proficiencyPercent) { this.proficiencyPercent = proficiencyPercent; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTargetDate() { return targetDate; }
    public void setTargetDate(String targetDate) { this.targetDate = targetDate; }
}
