package com.skillswap.dto.response;

import java.time.Instant;

public class MessageDto {

    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String status;
    private String referencedLessonId;
    private String referencedLessonTitle;
    private String referencedModuleId;
    private String detectedLanguage;
    private String detectedIntent;
    private String englishTranslation;
    private Instant createdAt;

    public MessageDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderAvatar() { return senderAvatar; }
    public void setSenderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReferencedLessonId() { return referencedLessonId; }
    public void setReferencedLessonId(String referencedLessonId) { this.referencedLessonId = referencedLessonId; }

    public String getReferencedLessonTitle() { return referencedLessonTitle; }
    public void setReferencedLessonTitle(String referencedLessonTitle) { this.referencedLessonTitle = referencedLessonTitle; }

    public String getReferencedModuleId() { return referencedModuleId; }
    public void setReferencedModuleId(String referencedModuleId) { this.referencedModuleId = referencedModuleId; }

    public String getDetectedLanguage() { return detectedLanguage; }
    public void setDetectedLanguage(String detectedLanguage) { this.detectedLanguage = detectedLanguage; }

    public String getDetectedIntent() { return detectedIntent; }
    public void setDetectedIntent(String detectedIntent) { this.detectedIntent = detectedIntent; }

    public String getEnglishTranslation() { return englishTranslation; }
    public void setEnglishTranslation(String englishTranslation) { this.englishTranslation = englishTranslation; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
