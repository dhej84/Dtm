package com.skillswap.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class LessonDetailDto {

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
    private List<LessonModuleDto> modules;
    private List<LessonResourceDto> resources;
    private List<CommentDto> comments;
    private LessonProgressDto userProgress;

    public static class LessonModuleDto {
        private String id;
        private String title;
        private String duration;
        private Integer sequenceOrder;
        private String description;
        private String contentSnippet;

        public LessonModuleDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public Integer getSequenceOrder() { return sequenceOrder; }
        public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getContentSnippet() { return contentSnippet; }
        public void setContentSnippet(String contentSnippet) { this.contentSnippet = contentSnippet; }
    }

    public static class LessonResourceDto {
        private String id;
        private String name;
        private String size;
        private String resourceType;
        private String url;

        public LessonResourceDto() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        public String getResourceType() { return resourceType; }
        public void setResourceType(String resourceType) { this.resourceType = resourceType; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    public LessonDetailDto() {}

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
    public List<LessonModuleDto> getModules() { return modules; }
    public void setModules(List<LessonModuleDto> modules) { this.modules = modules; }
    public List<LessonResourceDto> getResources() { return resources; }
    public void setResources(List<LessonResourceDto> resources) { this.resources = resources; }
    public List<CommentDto> getComments() { return comments; }
    public void setComments(List<CommentDto> comments) { this.comments = comments; }
    public LessonProgressDto getUserProgress() { return userProgress; }
    public void setUserProgress(LessonProgressDto userProgress) { this.userProgress = userProgress; }
}
