package com.skillswap.dto.response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AssessmentAttemptDto {

    private String id;
    private String assessmentId;
    private String moduleId;
    private Integer attemptNumber;
    private String status;
    private Integer score;
    private Integer totalPoints;
    private Integer percentage;
    private Boolean passed;
    private String feedback;
    private List<String> topicsToRevise = new ArrayList<>();
    private String weakestTopic;
    private Integer integrityEventsCount;
    private Instant startTime;
    private Instant endTime;
    private Integer timeTakenSeconds;

    public AssessmentAttemptDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotalPoints() { return totalPoints; }
    public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }

    public Integer getPercentage() { return percentage; }
    public void setPercentage(Integer percentage) { this.percentage = percentage; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public List<String> getTopicsToRevise() { return topicsToRevise; }
    public void setTopicsToRevise(List<String> topicsToRevise) { this.topicsToRevise = topicsToRevise; }

    public String getWeakestTopic() { return weakestTopic; }
    public void setWeakestTopic(String weakestTopic) { this.weakestTopic = weakestTopic; }

    public Integer getIntegrityEventsCount() { return integrityEventsCount; }
    public void setIntegrityEventsCount(Integer integrityEventsCount) { this.integrityEventsCount = integrityEventsCount; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public Integer getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(Integer timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
}
