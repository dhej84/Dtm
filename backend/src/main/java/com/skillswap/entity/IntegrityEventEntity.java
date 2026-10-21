package com.skillswap.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "integrity_events", indexes = {
    @Index(name = "idx_integ_attempt", columnList = "attempt_id")
})
public class IntegrityEventEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private AssessmentAttemptEntity attempt;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // tab_switch, focus_loss, fullscreen_exit, network_loss, inactivity, returned_focus

    @Column(nullable = false, length = 255)
    private String description;

    @Column(name = "duration_seconds")
    private Integer durationSeconds = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public IntegrityEventEntity() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public IntegrityEventEntity(AssessmentAttemptEntity attempt, String eventType, String description, Integer durationSeconds) {
        this();
        this.attempt = attempt;
        this.eventType = eventType;
        this.description = description;
        this.durationSeconds = durationSeconds != null ? durationSeconds : 0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public AssessmentAttemptEntity getAttempt() { return attempt; }
    public void setAttempt(AssessmentAttemptEntity attempt) { this.attempt = attempt; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
