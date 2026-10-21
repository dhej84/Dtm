package com.skillswap.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public class LessonDto {

    private String id;
    private String title;
    private String skill;
    private String category;
    private String description;
    private String skillLevel;
    private String format;
    private UserDto teacher;
    private Integer durationMinutes;
    private BigDecimal creditsRequired;
    private String prerequisites;
    private Integer enrolledStudentsCount;
    private Instant createdAt;
    private Instant updatedAt;

    public LessonDto() {}

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

    public String getSkillLevel() { return skillLevel; }
    public void setSkillLevel(String skillLevel) { this.skillLevel = skillLevel; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public UserDto getTeacher() { return teacher; }
    public void setTeacher(UserDto teacher) { this.teacher = teacher; }

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
}
