package com.skillswap.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ReportUserRequest {

    @NotBlank(message = "Reported user ID is required")
    private String reportedUserId;

    private String conversationId;
    private String messageId;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String details;

    public ReportUserRequest() {}

    public ReportUserRequest(String reportedUserId, String conversationId, String messageId, String reason, String details) {
        this.reportedUserId = reportedUserId;
        this.conversationId = conversationId;
        this.messageId = messageId;
        this.reason = reason;
        this.details = details;
    }

    public String getReportedUserId() { return reportedUserId; }
    public void setReportedUserId(String reportedUserId) { this.reportedUserId = reportedUserId; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
