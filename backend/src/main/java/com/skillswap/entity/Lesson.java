package com.skillswap.entity;

import com.skillswap.enums.LessonFormat;
import com.skillswap.enums.SkillLevel;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 150)
    private String skill;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 50)
    private SkillLevel skillLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private LessonFormat format = LessonFormat.INTERACTIVE_WORKSHOP;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @Column(name = "duration_minutes")
    private Integer durationMinutes = 60;

    @Column(name = "credits_required", precision = 5, scale = 2)
    private BigDecimal creditsRequired = new BigDecimal("1.00");

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @Column(name = "enrolled_students_count")
    private Integer enrolledStudentsCount = 0;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceOrder ASC")
    private List<LessonModule> modules = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<LessonResource> resources = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    private List<Comment> comments = new ArrayList<>();

    public Lesson() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
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

    // Helper methods for bidirectional relationships
    public void addModule(LessonModule module) {
        modules.add(module);
        module.setLesson(this);
    }

    public void removeModule(LessonModule module) {
        modules.remove(module);
        module.setLesson(null);
    }

    public void addResource(LessonResource resource) {
        resources.add(resource);
        resource.setLesson(this);
    }

    public void removeResource(LessonResource resource) {
        resources.remove(resource);
        resource.setLesson(null);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SkillLevel getSkillLevel() { return skillLevel; }
    public void setSkillLevel(SkillLevel skillLevel) { this.skillLevel = skillLevel; }

    public LessonFormat getFormat() { return format; }
    public void setFormat(LessonFormat format) { this.format = format; }

    public User getTeacher() { return teacher; }
    public void setTeacher(User teacher) { this.teacher = teacher; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public BigDecimal getCreditsRequired() { return creditsRequired; }
    public void setCreditsRequired(BigDecimal creditsRequired) { this.creditsRequired = creditsRequired; }

    public String getPrerequisites() { return prerequisites; }
    public void setPrerequisites(String prerequisites) { this.prerequisites = prerequisites; }

    public Integer getEnrolledStudentsCount() { return enrolledStudentsCount; }
    public void setEnrolledStudentsCount(Integer enrolledStudentsCount) { this.enrolledStudentsCount = enrolledStudentsCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<LessonModule> getModules() { return modules; }
    public void setModules(List<LessonModule> modules) { this.modules = modules; }

    public List<LessonResource> getResources() { return resources; }
    public void setResources(List<LessonResource> resources) { this.resources = resources; }

    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
}
