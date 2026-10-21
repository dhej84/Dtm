package com.skillswap.dto.request;

import com.skillswap.enums.SkillLevel;
import jakarta.validation.constraints.NotNull;

public class UpdateSkillLevelRequest {

    @NotNull(message = "Skill level is required")
    private SkillLevel skillLevel;

    private SkillLevel targetLevel;

    private Integer proficiencyPercent;

    private String description;

    public UpdateSkillLevelRequest() {}

    public UpdateSkillLevelRequest(SkillLevel skillLevel) {
        this.skillLevel = skillLevel;
    }

    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }

    public SkillLevel getTargetLevel() { return targetLevel; }
    public void setTargetLevel(SkillLevel targetLevel) { this.targetLevel = targetLevel; }

    public Integer getProficiencyPercent() { return proficiencyPercent; }
    public void setProficiencyPercent(Integer proficiencyPercent) { this.proficiencyPercent = proficiencyPercent; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
