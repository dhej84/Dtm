package com.skillswap.entity;

import com.skillswap.enums.SkillLevel;
import com.skillswap.enums.SkillType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_skills", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_skill", columnNames = {"user_id", "name", "skill_type"})
})
public class UserSkill {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String category = "General";

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_type", nullable = false, length = 20)
    private SkillType skillType;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 50)
    private SkillLevel skillLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_level", length = 50)
    private SkillLevel targetLevel;

    @Column(name = "proficiency_percent")
    private Integer proficiencyPercent = 75;

    @Column(name = "hours_logged", precision = 10, scale = 2)
    private BigDecimal hoursLogged = BigDecimal.ZERO;

    @Column(name = "hours_taught", precision = 10, scale = 2)
    private BigDecimal hoursTaught = BigDecimal.ZERO;

    @Column(name = "hours_practiced", precision = 10, scale = 2)
    private BigDecimal hoursPracticed = BigDecimal.ZERO;

    @Column(name = "endorsements_count")
    private Integer endorsementsCount = 0;

    @Column(name = "reviews_count")
    private Integer reviewsCount = 0;

    @Column(name = "partner_name", length = 150)
    private String partnerName;

    @Column(name = "target_date", length = 50)
    private String targetDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public UserSkill() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public UserSkill(User user, String name, String category, SkillType skillType, SkillLevel skillLevel) {
        this();
        this.user = user;
        this.name = name;
        this.category = category != null ? category : "General";
        this.skillType = skillType;
        this.skillLevel = skillLevel;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Skill getSkill() { return skill; }
    public void setSkill(Skill skill) { this.skill = skill; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public SkillType getSkillType() { return skillType; }
    public void setSkillType(SkillType skillType) { this.skillType = skillType; }

    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }

    public SkillLevel getTargetLevel() { return targetLevel; }
    public void setTargetLevel(SkillLevel targetLevel) { this.targetLevel = targetLevel; }

    public Integer getProficiencyPercent() { return proficiencyPercent; }
    public void setProficiencyPercent(Integer proficiencyPercent) { this.proficiencyPercent = proficiencyPercent; }

    public BigDecimal getHoursLogged() { return hoursLogged; }
    public void setHoursLogged(BigDecimal hoursLogged) { this.hoursLogged = hoursLogged; }

    public BigDecimal getHoursTaught() { return hoursTaught; }
    public void setHoursTaught(BigDecimal hoursTaught) { this.hoursTaught = hoursTaught; }

    public BigDecimal getHoursPracticed() { return hoursPracticed; }
    public void setHoursPracticed(BigDecimal hoursPracticed) { this.hoursPracticed = hoursPracticed; }

    public Integer getEndorsementsCount() { return endorsementsCount; }
    public void setEndorsementsCount(Integer endorsementsCount) { this.endorsementsCount = endorsementsCount; }

    public Integer getReviewsCount() { return reviewsCount; }
    public void setReviewsCount(Integer reviewsCount) { this.reviewsCount = reviewsCount; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getTargetDate() { return targetDate; }
    public void setTargetDate(String targetDate) { this.targetDate = targetDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
