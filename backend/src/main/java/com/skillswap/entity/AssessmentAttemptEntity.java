package com.skillswap.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "assessment_attempts", indexes = {
    @Index(name = "idx_att_user", columnList = "user_id"),
    @Index(name = "idx_att_assess", columnList = "assessment_id")
})
public class AssessmentAttemptEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private AssessmentEntity assessment;

    @Column(name = "module_id", nullable = false, length = 50)
    private String moduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attempt_number")
    private Integer attemptNumber = 1;

    @Column(nullable = false, length = 30)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, SUBMITTED, EVALUATED

    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;

    @Column
    private Integer score = 0;

    @Column(name = "total_points")
    private Integer totalPoints = 100;

    @Column
    private Integer percentage = 0;

    @Column
    private Boolean passed = false;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "topics_to_revise_json", columnDefinition = "TEXT")
    private String topicsToReviseJson;

    @Column(name = "weakest_topic", length = 100)
    private String weakestTopic;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IntegrityEventEntity> integrityEvents = new ArrayList<>();

    @Column(name = "start_time", updatable = false)
    private Instant startTime = Instant.now();

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds = 0;

    public AssessmentAttemptEntity() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public AssessmentEntity getAssessment() { return assessment; }
    public void setAssessment(AssessmentEntity assessment) { this.assessment = assessment; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getAttemptNumber() { return attemptNumber; }
    public void setAttemptNumber(Integer attemptNumber) { this.attemptNumber = attemptNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }

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

    public String getTopicsToReviseJson() { return topicsToReviseJson; }
    public void setTopicsToReviseJson(String topicsToReviseJson) { this.topicsToReviseJson = topicsToReviseJson; }

    public String getWeakestTopic() { return weakestTopic; }
    public void setWeakestTopic(String weakestTopic) { this.weakestTopic = weakestTopic; }

    public List<IntegrityEventEntity> getIntegrityEvents() { return integrityEvents; }
    public void setIntegrityEvents(List<IntegrityEventEntity> integrityEvents) { this.integrityEvents = integrityEvents; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public Integer getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(Integer timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
}
