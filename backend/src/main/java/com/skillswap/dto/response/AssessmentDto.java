package com.skillswap.dto.response;

import java.util.ArrayList;
import java.util.List;

public class AssessmentDto {

    private String id;
    private String lessonId;
    private String moduleId;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private Integer passingScorePercent;
    private Integer maxAttempts;
    private Boolean isExternalGoogleForm;
    private String googleFormUrl;
    private List<QuestionDto> questions = new ArrayList<>();

    public static class QuestionDto {
        private String id;
        private String questionText;
        private String questionType;
        private List<String> options;
        private String topic;
        private Integer points;

        public QuestionDto() {}

        public QuestionDto(String id, String questionText, String questionType, List<String> options, String topic, Integer points) {
            this.id = id;
            this.questionText = questionText;
            this.questionType = questionType;
            this.options = options;
            this.topic = topic;
            this.points = points;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }

        public String getQuestionType() { return questionType; }
        public void setQuestionType(String questionType) { this.questionType = questionType; }

        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }

        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }

        public Integer getPoints() { return points; }
        public void setPoints(Integer points) { this.points = points; }
    }

    public AssessmentDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getTimeLimitMinutes() { return timeLimitMinutes; }
    public void setTimeLimitMinutes(Integer timeLimitMinutes) { this.timeLimitMinutes = timeLimitMinutes; }

    public Integer getPassingScorePercent() { return passingScorePercent; }
    public void setPassingScorePercent(Integer passingScorePercent) { this.passingScorePercent = passingScorePercent; }

    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }

    public Boolean getIsExternalGoogleForm() { return isExternalGoogleForm; }
    public void setIsExternalGoogleForm(Boolean isExternalGoogleForm) { this.isExternalGoogleForm = isExternalGoogleForm; }

    public String getGoogleFormUrl() { return googleFormUrl; }
    public void setGoogleFormUrl(String googleFormUrl) { this.googleFormUrl = googleFormUrl; }

    public List<QuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<QuestionDto> questions) { this.questions = questions; }
}
