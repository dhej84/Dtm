package com.skillswap.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @Column(length = 36)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 150)
    private String location;

    @Column(length = 100)
    private String rank = "Campus Member";

    @Column(name = "member_since", length = 50)
    private String memberSince = "Sep 2024";

    @Column(name = "profile_visibility", length = 50)
    private String profileVisibility = "PUBLIC";

    @Column(name = "wallet_balance", precision = 10, scale = 2)
    private BigDecimal walletBalance = new BigDecimal("10.00");

    @Column(name = "hours_taught", precision = 10, scale = 2)
    private BigDecimal hoursTaught = BigDecimal.ZERO;

    @Column(name = "hours_learned", precision = 10, scale = 2)
    private BigDecimal hoursLearned = BigDecimal.ZERO;

    @Column(name = "peer_reputation", precision = 3, scale = 2)
    private BigDecimal peerReputation = new BigDecimal("5.00");

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @Column(name = "swap_fulfill_rate", precision = 5, scale = 2)
    private BigDecimal swapFulfillRate = new BigDecimal("100.00");

    @Column(name = "verified_peers_only")
    private Boolean verifiedPeersOnly = true;

    @Column(name = "allow_direct_swaps")
    private Boolean allowDirectSwaps = true;

    @Column(name = "public_learning_history")
    private Boolean publicLearningHistory = true;

    @Column(name = "mask_reviews")
    private Boolean maskReviews = false;

    @Column(name = "public_profile_id", length = 64, unique = true)
    private String publicProfileId;

    @Column(name = "public_profile_enabled")
    private Boolean publicProfileEnabled = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Profile() {}

    public Profile(User user) {
        this.user = user;
        this.id = user.getId();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) {
        this.user = user;
        if (user != null) {
            this.id = user.getId();
        }
    }

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
}
