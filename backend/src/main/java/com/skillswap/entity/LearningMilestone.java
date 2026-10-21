package com.skillswap.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "learning_milestones")
public class LearningMilestone {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "time_ago", length = 100)
    private String timeAgo = "Recently";

    @Column(name = "date_str", length = 100)
    private String dateStr;

    @Column(name = "milestone_type", length = 50)
    private String milestoneType = "learning"; // 'teaching', 'learning', 'badge'

    @Column(name = "credits_change", precision = 5, scale = 2)
    private BigDecimal creditsChange = BigDecimal.ZERO;

    @Column(name = "badge_triggered", length = 100)
    private String badgeTriggered;

    @Column(name = "partner_name", length = 150)
    private String partnerName;

    @Column(length = 100)
    private String term = "Fall '24";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public LearningMilestone() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public LearningMilestone(User user, String title, String description, String milestoneType, BigDecimal creditsChange, String partnerName) {
        this();
        this.user = user;
        this.title = title;
        this.description = description;
        this.milestoneType = milestoneType;
        this.creditsChange = creditsChange;
        this.partnerName = partnerName;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTimeAgo() { return timeAgo; }
    public void setTimeAgo(String timeAgo) { this.timeAgo = timeAgo; }

    public String getDateStr() { return dateStr; }
    public void setDateStr(String dateStr) { this.dateStr = dateStr; }

    public String getMilestoneType() { return milestoneType; }
    public void setMilestoneType(String milestoneType) { this.milestoneType = milestoneType; }

    public BigDecimal getCreditsChange() { return creditsChange; }
    public void setCreditsChange(BigDecimal creditsChange) { this.creditsChange = creditsChange; }

    public String getBadgeTriggered() { return badgeTriggered; }
    public void setBadgeTriggered(String badgeTriggered) { this.badgeTriggered = badgeTriggered; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
