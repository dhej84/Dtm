package com.skillswap.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "assessments", indexes = {
    @Index(name = "idx_assess_module", columnList = "module_id"),
    @Index(name = "idx_assess_lesson", columnList = "lesson_id")
})
public class AssessmentEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "module_id", nullable = false, length = 50)
    private String moduleId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes = 10;

    @Column(name = "passing_score_percent")
    private Integer passingScorePercent = 70;

    @Column(name = "max_attempts")
    private Integer maxAttempts = 3;

    @Column(name = "cooldown_minutes")
    private Integer cooldownMinutes = 0;

    @Column(name = "is_external_google_form")
    private Boolean isExternalGoogleForm = false;

    @Column(name = "google_form_url", length = 500)
    private String googleFormUrl;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssessmentQuestionEntity> questions = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public AssessmentEntity() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public Integer getPassingScorePercent() { return passingScorePercent; }
    public void setPassingScorePercent(Integer passingScorePercent) { this.passingScorePercent = passingScorePercent; }

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public Integer getCooldownMinutes() { return cooldownMinutes; }
    public void setCooldownMinutes(Integer cooldownMinutes) { this.cooldownMinutes = cooldownMinutes; }

    public Boolean getIsExternalGoogleForm() { return isExternalGoogleForm; }
    public void setIsExternalGoogleForm(Boolean isExternalGoogleForm) { this.isExternalGoogleForm = isExternalGoogleForm; }

    public String getGoogleFormUrl() { return googleFormUrl; }
    public void setGoogleFormUrl(String googleFormUrl) { this.googleFormUrl = googleFormUrl; }

    public List<AssessmentQuestionEntity> getQuestions() { return questions; }
    public void setQuestions(List<AssessmentQuestionEntity> questions) { this.questions = questions; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
