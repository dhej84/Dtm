package com.skillswap.dto.response;

import java.time.Instant;

public class ConnectionDto {

    private String id;
    private UserDto fromUser;
    private UserDto toUser;
    private String teachSkill;
    private String learnSkill;
    private String message;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public ConnectionDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public UserDto getFromUser() { return fromUser; }
    public void setFromUser(UserDto fromUser) { this.fromUser = fromUser; }
    public UserDto getToUser() { return toUser; }
    public void setToUser(UserDto toUser) { this.toUser = toUser; }
    public String getTeachSkill() { return teachSkill; }
    public void setTeachSkill(String teachSkill) { this.teachSkill = teachSkill; }
    public String getLearnSkill() { return learnSkill; }
    public void setLearnSkill(String learnSkill) { this.learnSkill = learnSkill; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
