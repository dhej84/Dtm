package com.skillswap.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SendMessageRequest {

    private String conversationId;

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 1000, message = "Message content must not exceed 1000 characters")
    private String content;

    private String referencedLessonId;
    private String referencedModuleId;

    public SendMessageRequest() {}

    public SendMessageRequest(String conversationId, String content, String referencedLessonId, String referencedModuleId) {
        this.conversationId = conversationId;
        this.content = content;
        this.referencedLessonId = referencedLessonId;
        this.referencedModuleId = referencedModuleId;
    }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getReferencedLessonId() { return referencedLessonId; }
    public void setReferencedLessonId(String referencedLessonId) { this.referencedLessonId = referencedLessonId; }

    public String getReferencedModuleId() { return referencedModuleId; }
    public void setReferencedModuleId(String referencedModuleId) { this.referencedModuleId = referencedModuleId; }
}
