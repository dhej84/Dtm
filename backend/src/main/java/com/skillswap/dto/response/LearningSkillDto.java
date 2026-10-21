package com.skillswap.dto.response;

import java.math.BigDecimal;

public class LearningSkillDto {

    private String id;
    private String name;
    private String category;
    private String currentLevel;
    private String targetLevel;
    private Integer progressPercent;
    private BigDecimal hoursPracticed;
    private String partnerName;
    private String targetDate;

    public LearningSkillDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(String currentLevel) { this.currentLevel = currentLevel; }

    public String getTargetLevel() { return targetLevel; }
    public void setTargetLevel(String targetLevel) { this.targetLevel = targetLevel; }

    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }

    public BigDecimal getHoursPracticed() { return hoursPracticed; }
    public void setHoursPracticed(BigDecimal hoursPracticed) { this.hoursPracticed = hoursPracticed; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getTargetDate() { return targetDate; }
    public void setTargetDate(String targetDate) { this.targetDate = targetDate; }
}
