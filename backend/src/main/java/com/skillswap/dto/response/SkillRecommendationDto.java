package com.skillswap.dto.response;

public class SkillRecommendationDto {

    private String skillName;
    private String category;
    private String reason;
    private Double score;
    private Integer existingPeersTeaching;
    private Integer availableLessons;

    public SkillRecommendationDto() {}

    public SkillRecommendationDto(String skillName, String category, String reason,
                                  Double score, Integer existingPeersTeaching, Integer availableLessons) {
        this.skillName = skillName;
        this.category = category;
        this.reason = reason;
        this.score = score;
        this.existingPeersTeaching = existingPeersTeaching != null ? existingPeersTeaching : 0;
        this.availableLessons = availableLessons != null ? availableLessons : 0;
    }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Integer getExistingPeersTeaching() { return existingPeersTeaching; }
    public void setExistingPeersTeaching(Integer existingPeersTeaching) { this.existingPeersTeaching = existingPeersTeaching; }

    public Integer getAvailableLessons() { return availableLessons; }
    public void setAvailableLessons(Integer availableLessons) { this.availableLessons = availableLessons; }
}
