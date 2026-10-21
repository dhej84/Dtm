package com.skillswap.dto.response;

import java.math.BigDecimal;

public class TeachingSkillDto {
    private String id;
    private String name;
    private String category;
    private String level;
    private BigDecimal hoursTaught;
    private Integer reviewsCount;
    private Integer endorsementsCount;
    private String description;
    private Integer proficiencyPercent;

    public TeachingSkillDto() {}

    public TeachingSkillDto(String id, String name, String category, String level, BigDecimal hoursTaught, Integer reviewsCount, Integer endorsementsCount, String description, Integer proficiencyPercent) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.level = level;
        this.hoursTaught = hoursTaught;
        this.reviewsCount = reviewsCount;
        this.endorsementsCount = endorsementsCount;
        this.description = description;
        this.proficiencyPercent = proficiencyPercent;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public BigDecimal getHoursTaught() { return hoursTaught; }
    public void setHoursTaught(BigDecimal hoursTaught) { this.hoursTaught = hoursTaught; }

    public Integer getReviewsCount() { return reviewsCount; }
    public void setReviewsCount(Integer reviewsCount) { this.reviewsCount = reviewsCount; }

    public Integer getEndorsementsCount() { return endorsementsCount; }
    public void setEndorsementsCount(Integer endorsementsCount) { this.endorsementsCount = endorsementsCount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getProficiencyPercent() { return proficiencyPercent; }
    public void setProficiencyPercent(Integer proficiencyPercent) { this.proficiencyPercent = proficiencyPercent; }
}
