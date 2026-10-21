package com.skillswap.dto.request;

import jakarta.validation.constraints.NotBlank;

public class RecordIntegrityEventRequest {

    @NotBlank(message = "Event type is required")
    private String eventType;

    @NotBlank(message = "Description is required")
    private String description;

    private Integer durationSeconds = 0;

    public RecordIntegrityEventRequest() {}

    public RecordIntegrityEventRequest(String eventType, String description, Integer durationSeconds) {
        this.eventType = eventType;
        this.description = description;
        this.durationSeconds = durationSeconds;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
}
