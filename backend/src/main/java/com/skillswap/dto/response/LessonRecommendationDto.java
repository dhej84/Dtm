package com.skillswap.dto.response;

public class LessonRecommendationDto {

    private LessonDto lesson;
    private String relevantSkill;
    private String skillLevel;
    private Double recommendationScore;
    private String reason;

    public LessonRecommendationDto() {}

    public LessonRecommendationDto(LessonDto lesson, String relevantSkill, String skillLevel,
                                   Double recommendationScore, String reason) {
        this.lesson = lesson;
        this.relevantSkill = relevantSkill;
        this.skillLevel = skillLevel;
        this.recommendationScore = recommendationScore;
        this.reason = reason;
    }

    public LessonDto getLesson() { return lesson; }
    public void setLesson(LessonDto lesson) { this.lesson = lesson; }

    public String getRelevantSkill() { return relevantSkill; }
    public void setRelevantSkill(String relevantSkill) { this.relevantSkill = relevantSkill; }

    public String getSkillLevel() { return skillLevel; }
    public void setSkillLevel(String skillLevel) { this.skillLevel = skillLevel; }

    public Double getRecommendationScore() { return recommendationScore; }
    public void setRecommendationScore(Double recommendationScore) { this.recommendationScore = recommendationScore; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
