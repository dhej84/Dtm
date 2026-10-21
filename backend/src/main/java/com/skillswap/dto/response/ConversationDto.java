package com.skillswap.dto.response;

import java.time.Instant;

public class ConversationDto {

    private String id;
    private String partnerId;
    private String partnerName;
    private String partnerAvatar;
    private String partnerProgram;
    private String partnerRole;
    private String lastMessageContent;
    private Instant lastMessageAt;
    private Integer unreadCount;
    private String activeLessonId;
    private String activeLessonTitle;
    private Instant createdAt;

    public ConversationDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String partnerId) { this.partnerId = partnerId; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getPartnerAvatar() { return partnerAvatar; }
    public void setPartnerAvatar(String partnerAvatar) { this.partnerAvatar = partnerAvatar; }

    public String getPartnerProgram() { return partnerProgram; }
    public void setPartnerProgram(String partnerProgram) { this.partnerProgram = partnerProgram; }

    public String getPartnerRole() { return partnerRole; }
    public void setPartnerRole(String partnerRole) { this.partnerRole = partnerRole; }

    public String getLastMessageContent() { return lastMessageContent; }
    public void setLastMessageContent(String lastMessageContent) { this.lastMessageContent = lastMessageContent; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public Integer getUnreadCount() { return unreadCount; }
    public void setUnreadCount(Integer unreadCount) { this.unreadCount = unreadCount; }

    public String getActiveLessonId() { return activeLessonId; }
    public void setActiveLessonId(String activeLessonId) { this.activeLessonId = activeLessonId; }

    public String getActiveLessonTitle() { return activeLessonTitle; }
    public void setActiveLessonTitle(String activeLessonTitle) { this.activeLessonTitle = activeLessonTitle; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
