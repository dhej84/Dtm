package com.skillswap.dto.response;

import java.time.Instant;

public class AchievementDto {

    private String id;
    private String title;
    private String category;
    private String description;
    private String icon;
    private String iconBgColor;
    private String progressText;
    private Integer fillPercent;
    private String levelBadge;
    private Integer endorsementsCount;
    private String issuedDate;
    private Instant earnedAt;

    public AchievementDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getIconBgColor() { return iconBgColor; }
    public void setIconBgColor(String iconBgColor) { this.iconBgColor = iconBgColor; }
    public String getProgressText() { return progressText; }
    public void setProgressText(String progressText) { this.progressText = progressText; }
    public Integer getFillPercent() { return fillPercent; }
    public void setFillPercent(Integer fillPercent) { this.fillPercent = fillPercent; }
    public String getLevelBadge() { return levelBadge; }
    public void setLevelBadge(String levelBadge) { this.levelBadge = levelBadge; }
    public Integer getEndorsementsCount() { return endorsementsCount; }
    public void setEndorsementsCount(Integer endorsementsCount) { this.endorsementsCount = endorsementsCount; }
    public String getIssuedDate() { return issuedDate; }
    public void setIssuedDate(String issuedDate) { this.issuedDate = issuedDate; }
    public Instant getEarnedAt() { return earnedAt; }
    public void setEarnedAt(Instant earnedAt) { this.earnedAt = earnedAt; }
}
