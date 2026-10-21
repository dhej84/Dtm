package com.skillswap.dto.response;

import java.util.ArrayList;
import java.util.List;

public class StudentRecommendationDto {

    private UserDto student;
    private Double matchScore;
    private List<String> matchedSkills = new ArrayList<>();
    private List<String> matchingReasons = new ArrayList<>();
    private Boolean isMutualMatch = false;
    private List<String> mutualSkills = new ArrayList<>();
    private String compatibilitySummary;

    public StudentRecommendationDto() {}

    public StudentRecommendationDto(UserDto student, Double matchScore, List<String> matchedSkills,
                                    List<String> matchingReasons, Boolean isMutualMatch,
                                    List<String> mutualSkills, String compatibilitySummary) {
        this.student = student;
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills != null ? matchedSkills : new ArrayList<>();
        this.matchingReasons = matchingReasons != null ? matchingReasons : new ArrayList<>();
        this.isMutualMatch = isMutualMatch != null ? isMutualMatch : false;
        this.mutualSkills = mutualSkills != null ? mutualSkills : new ArrayList<>();
        this.compatibilitySummary = compatibilitySummary;
    }

    public UserDto getStudent() { return student; }
    public void setStudent(UserDto student) { this.student = student; }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }

    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }

    public List<String> getMatchingReasons() { return matchingReasons; }
    public void setMatchingReasons(List<String> matchingReasons) { this.matchingReasons = matchingReasons; }

    public Boolean getIsMutualMatch() { return isMutualMatch; }
    public void setIsMutualMatch(Boolean isMutualMatch) { this.isMutualMatch = isMutualMatch; }

    public List<String> getMutualSkills() { return mutualSkills; }
    public void setMutualSkills(List<String> mutualSkills) { this.mutualSkills = mutualSkills; }

    public String getCompatibilitySummary() { return compatibilitySummary; }
    public void setCompatibilitySummary(String compatibilitySummary) { this.compatibilitySummary = compatibilitySummary; }
}
