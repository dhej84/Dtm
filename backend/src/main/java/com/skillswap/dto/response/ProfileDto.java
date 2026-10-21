package com.skillswap.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class ProfileDto {

    private String id;
    private UserDto user;
    private String bio;
    private String location;
    private String rank;
    private String memberSince;
    private String profileVisibility;
    private BigDecimal walletBalance;
    private BigDecimal hoursTaught;
    private BigDecimal hoursLearned;
    private BigDecimal peerReputation;
    private Integer reviewCount;
    private BigDecimal swapFulfillRate;
    private Boolean verifiedPeersOnly;
    private Boolean allowDirectSwaps;
    private Boolean publicLearningHistory;
    private Boolean maskReviews;
    private String publicProfileId;
    private Boolean publicProfileEnabled;
    private Instant createdAt;
    private Instant updatedAt;
    private List<TeachingSkillDto> teachingSkills;
    private List<LearningSkillDto> learningSkills;

    public ProfileDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRank() { return rank; }
    public void setRank(String rank) { this.rank = rank; }

    public String getMemberSince() { return memberSince; }
    public void setMemberSince(String memberSince) { this.memberSince = memberSince; }

    public String getProfileVisibility() { return profileVisibility; }
    public void setProfileVisibility(String profileVisibility) { this.profileVisibility = profileVisibility; }

    public BigDecimal getWalletBalance() { return walletBalance; }
    public void setWalletBalance(BigDecimal walletBalance) { this.walletBalance = walletBalance; }

    public BigDecimal getHoursTaught() { return hoursTaught; }
    public void setHoursTaught(BigDecimal hoursTaught) { this.hoursTaught = hoursTaught; }

    public BigDecimal getHoursLearned() { return hoursLearned; }
    public void setHoursLearned(BigDecimal hoursLearned) { this.hoursLearned = hoursLearned; }

    public BigDecimal getPeerReputation() { return peerReputation; }
    public void setPeerReputation(BigDecimal peerReputation) { this.peerReputation = peerReputation; }

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    public BigDecimal getSwapFulfillRate() { return swapFulfillRate; }
    public void setSwapFulfillRate(BigDecimal swapFulfillRate) { this.swapFulfillRate = swapFulfillRate; }

    public Boolean getVerifiedPeersOnly() { return verifiedPeersOnly; }
    public void setVerifiedPeersOnly(Boolean verifiedPeersOnly) { this.verifiedPeersOnly = verifiedPeersOnly; }

    public Boolean getAllowDirectSwaps() { return allowDirectSwaps; }
    public void setAllowDirectSwaps(Boolean allowDirectSwaps) { this.allowDirectSwaps = allowDirectSwaps; }

    public Boolean getPublicLearningHistory() { return publicLearningHistory; }
    public void setPublicLearningHistory(Boolean publicLearningHistory) { this.publicLearningHistory = publicLearningHistory; }

    public Boolean getMaskReviews() { return maskReviews; }
    public void setMaskReviews(Boolean maskReviews) { this.maskReviews = maskReviews; }

    public String getPublicProfileId() { return publicProfileId; }
    public void setPublicProfileId(String publicProfileId) { this.publicProfileId = publicProfileId; }

    public Boolean getPublicProfileEnabled() { return publicProfileEnabled; }
    public void setPublicProfileEnabled(Boolean publicProfileEnabled) { this.publicProfileEnabled = publicProfileEnabled; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<TeachingSkillDto> getTeachingSkills() { return teachingSkills; }
    public void setTeachingSkills(List<TeachingSkillDto> teachingSkills) { this.teachingSkills = teachingSkills; }

    public List<LearningSkillDto> getLearningSkills() { return learningSkills; }
    public void setLearningSkills(List<LearningSkillDto> learningSkills) { this.learningSkills = learningSkills; }
}
