package com.skillswap.dto.request;

import java.util.Map;

public class SubmitAssessmentRequest {

    private Map<String, Object> answers;

    public SubmitAssessmentRequest() {}

    public SubmitAssessmentRequest(Map<String, Object> answers) {
        this.answers = answers;
    }

    public Map<String, Object> getAnswers() { return answers; }
    public void setAnswers(Map<String, Object> answers) { this.answers = answers; }
}
