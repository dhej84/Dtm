package com.skillswap.dto.request;

import jakarta.validation.constraints.Size;

public class ProfileUpdateRequest {

    @Size(max = 2000, message = "Bio cannot exceed 2000 characters")
    private String bio;

    @Size(max = 150, message = "Location cannot exceed 150 characters")
    private String location;

    private String avatarUrl;

    private String profileVisibility;

    private Boolean verifiedPeersOnly;
    private Boolean allowDirectSwaps;
    private Boolean publicLearningHistory;
    private Boolean maskReviews;

    public ProfileUpdateRequest() {}

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getProfileVisibility() { return profileVisibility; }
    public void setProfileVisibility(String profileVisibility) { this.profileVisibility = profileVisibility; }

    public Boolean getVerifiedPeersOnly() { return verifiedPeersOnly; }
    public void setVerifiedPeersOnly(Boolean verifiedPeersOnly) { this.verifiedPeersOnly = verifiedPeersOnly; }

    public Boolean getAllowDirectSwaps() { return allowDirectSwaps; }
    public void setAllowDirectSwaps(Boolean allowDirectSwaps) { this.allowDirectSwaps = allowDirectSwaps; }

    public Boolean getPublicLearningHistory() { return publicLearningHistory; }
    public void setPublicLearningHistory(Boolean publicLearningHistory) { this.publicLearningHistory = publicLearningHistory; }

    public Boolean getMaskReviews() { return maskReviews; }
    public void setMaskReviews(Boolean maskReviews) { this.maskReviews = maskReviews; }
}
