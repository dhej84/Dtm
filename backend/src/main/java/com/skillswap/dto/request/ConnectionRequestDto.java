package com.skillswap.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ConnectionRequestDto {

    @NotBlank(message = "Recipient user ID is required")
    private String toUserId;

    private String teachSkill;

    private String learnSkill;

    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;

    public ConnectionRequestDto() {}

    public String getToUserId() { return toUserId; }
    public void setToUserId(String toUserId) { this.toUserId = toUserId; }

    public String getTeachSkill() { return teachSkill; }
    public void setTeachSkill(String teachSkill) { this.teachSkill = teachSkill; }

    public String getLearnSkill() { return learnSkill; }
    public void setLearnSkill(String learnSkill) { this.learnSkill = learnSkill; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
