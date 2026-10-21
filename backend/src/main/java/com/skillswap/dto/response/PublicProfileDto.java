package com.skillswap.dto.response;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Privacy-safe Data Transfer Object for public profile sharing.
 * Strictly omits sensitive information such as:
 * - Email address
 * - Password / hashes
 * - JWT / session tokens
 * - Wallet balance
 * - Private messages / connections
 * - Private assessment answers / monitoring events
 */
public class PublicProfileDto {

    private String publicProfileId;
    private String name;
    private String avatarUrl;
    private String bio;
    private String university;
    private String department;
    private String year;
    private String location;
    private String rank;
    private String memberSince;
    private Boolean isVerified;
    private Boolean publicProfileEnabled = true;
    private Boolean publicLearningHistory = true;

    private List<PublicSkillItem> teachingSkills = new ArrayList<>();
    private List<PublicSkillItem> learningSkills = new ArrayList<>();
    private List<PublicAchievementItem> achievements = new ArrayList<>();
    private List<PublicLessonItem> lessonsCreated = new ArrayList<>();
    private PublicActivitySummary activitySummary = new PublicActivitySummary();

    public PublicProfileDto() {}

    // Inner classes for structured, sanitized public display
    public static class PublicSkillItem {
        private String name;
        private String category;
        private String level;
        private String description;
        private Integer endorsementsCount;
        private BigDecimal hoursTaught;

        public PublicSkillItem() {}

        public PublicSkillItem(String name, String category, String level, String description, Integer endorsementsCount, BigDecimal hoursTaught) {
            this.name = name;
            this.category = category;
            this.level = level;
            this.description = description;
            this.endorsementsCount = endorsementsCount;
            this.hoursTaught = hoursTaught;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Integer getEndorsementsCount() { return endorsementsCount; }
        public void setEndorsementsCount(Integer endorsementsCount) { this.endorsementsCount = endorsementsCount; }

        public BigDecimal getHoursTaught() { return hoursTaught; }
        public void setHoursTaught(BigDecimal hoursTaught) { this.hoursTaught = hoursTaught; }
    }

    public static class PublicAchievementItem {
        private String id;
        private String title;
        private String category;
        private String description;
        private String icon;
        private String iconBgColor;
        private String levelBadge;

        public PublicAchievementItem() {}

        public PublicAchievementItem(String id, String title, String category, String description, String icon, String iconBgColor, String levelBadge) {
            this.id = id;
            this.title = title;
            this.category = category;
            this.description = description;
            this.icon = icon;
            this.iconBgColor = iconBgColor;
            this.levelBadge = levelBadge;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }

        public String getIconBgColor() { return iconBgColor; }
        public void setIconBgColor(String iconBgColor) { this.iconBgColor = iconBgColor; }

        public String getLevelBadge() { return levelBadge; }
        public void setLevelBadge(String levelBadge) { this.levelBadge = levelBadge; }
    }

    public static class PublicLessonItem {
        private String id;
        private String title;
        private String category;
        private String description;
        private String difficultyLevel;
        private Integer durationMinutes;

        public PublicLessonItem() {}

        public PublicLessonItem(String id, String title, String category, String description, String difficultyLevel, Integer durationMinutes) {
            this.id = id;
            this.title = title;
            this.category = category;
            this.description = description;
            this.difficultyLevel = difficultyLevel;
            this.durationMinutes = durationMinutes;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getDifficultyLevel() { return difficultyLevel; }
        public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

        public Integer getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    }

    public static class PublicActivitySummary {
        private BigDecimal hoursTaught;
        private BigDecimal hoursLearned;
        private Integer reviewCount;
        private BigDecimal peerReputation;
        private BigDecimal swapFulfillRate;
        private String memberSince;

        public PublicActivitySummary() {}

        public PublicActivitySummary(BigDecimal hoursTaught, BigDecimal hoursLearned, Integer reviewCount, BigDecimal peerReputation, BigDecimal swapFulfillRate, String memberSince) {
            this.hoursTaught = hoursTaught;
            this.hoursLearned = hoursLearned;
            this.reviewCount = reviewCount;
            this.peerReputation = peerReputation;
            this.swapFulfillRate = swapFulfillRate;
            this.memberSince = memberSince;
        }

        public BigDecimal getHoursTaught() { return hoursTaught; }
        public void setHoursTaught(BigDecimal hoursTaught) { this.hoursTaught = hoursTaught; }

        public BigDecimal getHoursLearned() { return hoursLearned; }
        public void setHoursLearned(BigDecimal hoursLearned) { this.hoursLearned = hoursLearned; }

        public Integer getReviewCount() { return reviewCount; }
        public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

        public BigDecimal getPeerReputation() { return peerReputation; }
        public void setPeerReputation(BigDecimal peerReputation) { this.peerReputation = peerReputation; }

        public BigDecimal getSwapFulfillRate() { return swapFulfillRate; }
        public void setSwapFulfillRate(BigDecimal swapFulfillRate) { this.swapFulfillRate = swapFulfillRate; }

        public String getMemberSince() { return memberSince; }
        public void setMemberSince(String memberSince) { this.memberSince = memberSince; }
    }

    // Getters and Setters for top-level fields
    public String getPublicProfileId() { return publicProfileId; }
    public void setPublicProfileId(String publicProfileId) { this.publicProfileId = publicProfileId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRank() { return rank; }
    public void setRank(String rank) { this.rank = rank; }

    public String getMemberSince() { return memberSince; }
    public void setMemberSince(String memberSince) { this.memberSince = memberSince; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public Boolean getPublicProfileEnabled() { return publicProfileEnabled; }
    public void setPublicProfileEnabled(Boolean publicProfileEnabled) { this.publicProfileEnabled = publicProfileEnabled; }

    public Boolean getPublicLearningHistory() { return publicLearningHistory; }
    public void setPublicLearningHistory(Boolean publicLearningHistory) { this.publicLearningHistory = publicLearningHistory; }

    public List<PublicSkillItem> getTeachingSkills() { return teachingSkills; }
    public void setTeachingSkills(List<PublicSkillItem> teachingSkills) { this.teachingSkills = teachingSkills; }

    public List<PublicSkillItem> getLearningSkills() { return learningSkills; }
    public void setLearningSkills(List<PublicSkillItem> learningSkills) { this.learningSkills = learningSkills; }

    public List<PublicAchievementItem> getAchievements() { return achievements; }
    public void setAchievements(List<PublicAchievementItem> achievements) { this.achievements = achievements; }

    public List<PublicLessonItem> getLessonsCreated() { return lessonsCreated; }
    public void setLessonsCreated(List<PublicLessonItem> lessonsCreated) { this.lessonsCreated = lessonsCreated; }

    public PublicActivitySummary getActivitySummary() { return activitySummary; }
    public void setActivitySummary(PublicActivitySummary activitySummary) { this.activitySummary = activitySummary; }
}
