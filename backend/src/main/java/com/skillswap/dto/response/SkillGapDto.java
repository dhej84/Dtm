package com.skillswap.dto.response;

import java.util.ArrayList;
import java.util.List;

public class SkillGapDto {

    private String skillName;
    private String category;
    private String currentLevel;
    private String targetLevel;
    private String gapDescription;
    private List<String> recommendedNextSteps = new ArrayList<>();
    private Integer completedLessonsInSkill = 0;
    private Boolean hasCompletedLessons = false;

    public SkillGapDto() {}

    public SkillGapDto(String skillName, String category, String currentLevel, String targetLevel,
                       String gapDescription, List<String> recommendedNextSteps,
                       Integer completedLessonsInSkill, Boolean hasCompletedLessons) {
        this.skillName = skillName;
        this.category = category;
        this.currentLevel = currentLevel;
        this.targetLevel = targetLevel;
        this.gapDescription = gapDescription;
        this.recommendedNextSteps = recommendedNextSteps != null ? recommendedNextSteps : new ArrayList<>();
        this.completedLessonsInSkill = completedLessonsInSkill != null ? completedLessonsInSkill : 0;
        this.hasCompletedLessons = hasCompletedLessons != null ? hasCompletedLessons : false;
    }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(String currentLevel) { this.currentLevel = currentLevel; }

    public String getTargetLevel() { return targetLevel; }
    public void setTargetLevel(String targetLevel) { this.targetLevel = targetLevel; }

    public String getGapDescription() { return gapDescription; }
    public void setGapDescription(String gapDescription) { this.gapDescription = gapDescription; }

    public List<String> getRecommendedNextSteps() { return recommendedNextSteps; }
    public void setRecommendedNextSteps(List<String> recommendedNextSteps) { this.recommendedNextSteps = recommendedNextSteps; }

    public Integer getCompletedLessonsInSkill() { return completedLessonsInSkill; }
    public void setCompletedLessonsInSkill(Integer completedLessonsInSkill) { this.completedLessonsInSkill = completedLessonsInSkill; }

    public Boolean getHasCompletedLessons() { return hasCompletedLessons; }
    public void setHasCompletedLessons(Boolean hasCompletedLessons) { this.hasCompletedLessons = hasCompletedLessons; }
}
