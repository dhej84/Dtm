package com.skillswap.dto.request;

public class PrivacySettingsDto {
    private Boolean verifiedPeersOnly;
    private Boolean allowDirectSwaps;
    private Boolean publicLearningHistory;
    private Boolean maskReviews;
    private Boolean publicProfileEnabled;

    public PrivacySettingsDto() {}

    public PrivacySettingsDto(Boolean verifiedPeersOnly, Boolean allowDirectSwaps, Boolean publicLearningHistory, Boolean maskReviews, Boolean publicProfileEnabled) {
        this.verifiedPeersOnly = verifiedPeersOnly;
        this.allowDirectSwaps = allowDirectSwaps;
        this.publicLearningHistory = publicLearningHistory;
        this.maskReviews = maskReviews;
        this.publicProfileEnabled = publicProfileEnabled;
    }

    public Boolean getVerifiedPeersOnly() { return verifiedPeersOnly; }
    public void setVerifiedPeersOnly(Boolean verifiedPeersOnly) { this.verifiedPeersOnly = verifiedPeersOnly; }

    public Boolean getAllowDirectSwaps() { return allowDirectSwaps; }
    public void setAllowDirectSwaps(Boolean allowDirectSwaps) { this.allowDirectSwaps = allowDirectSwaps; }

    public Boolean getPublicLearningHistory() { return publicLearningHistory; }
    public void setPublicLearningHistory(Boolean publicLearningHistory) { this.publicLearningHistory = publicLearningHistory; }

    public Boolean getMaskReviews() { return maskReviews; }
    public void setMaskReviews(Boolean maskReviews) { this.maskReviews = maskReviews; }

    public Boolean getPublicProfileEnabled() { return publicProfileEnabled; }
    public void setPublicProfileEnabled(Boolean publicProfileEnabled) { this.publicProfileEnabled = publicProfileEnabled; }
}
