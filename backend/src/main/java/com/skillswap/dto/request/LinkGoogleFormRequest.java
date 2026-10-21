package com.skillswap.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LinkGoogleFormRequest {

    @NotBlank(message = "Module ID is required")
    private String moduleId;

    @NotBlank(message = "Lesson ID is required")
    private String lessonId;

    @NotBlank(message = "Google Form URL is required")
    private String googleFormUrl;

    private String title;

    public LinkGoogleFormRequest() {}

    public LinkGoogleFormRequest(String moduleId, String lessonId, String googleFormUrl, String title) {
        this.moduleId = moduleId;
        this.lessonId = lessonId;
        this.googleFormUrl = googleFormUrl;
        this.title = title;
    }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public String getGoogleFormUrl() { return googleFormUrl; }
    public void setGoogleFormUrl(String googleFormUrl) { this.googleFormUrl = googleFormUrl; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
