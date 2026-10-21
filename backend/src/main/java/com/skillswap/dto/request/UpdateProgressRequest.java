package com.skillswap.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class UpdateProgressRequest {

    @Min(value = 0, message = "Progress percent must be at least 0")
    @Max(value = 100, message = "Progress percent cannot exceed 100")
    private Integer progressPercent;

    private Boolean isCompleted;

    private String completionStatus;

    private String userNotes;

    private Integer currentStepIndex;

    private String completedModuleIds;

    public UpdateProgressRequest() {}

    public Integer getProgressPercent() { return progressPercent; }
    public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }

    public Boolean getIsCompleted() { return isCompleted; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }

    public String getCompletionStatus() { return completionStatus; }
    public void setCompletionStatus(String completionStatus) { this.completionStatus = completionStatus; }

    public String getUserNotes() { return userNotes; }
    public void setUserNotes(String userNotes) { this.userNotes = userNotes; }

    public Integer getCurrentStepIndex() { return currentStepIndex; }
    public void setCurrentStepIndex(Integer currentStepIndex) { this.currentStepIndex = currentStepIndex; }

    public String getCompletedModuleIds() { return completedModuleIds; }
    public void setCompletedModuleIds(String completedModuleIds) { this.completedModuleIds = completedModuleIds; }
}
