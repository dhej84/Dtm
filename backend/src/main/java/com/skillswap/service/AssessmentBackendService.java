package com.skillswap.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.dto.request.LinkGoogleFormRequest;
import com.skillswap.dto.request.RecordIntegrityEventRequest;
import com.skillswap.dto.request.SubmitAssessmentRequest;
import com.skillswap.dto.response.AssessmentAttemptDto;
import com.skillswap.dto.response.AssessmentDto;
import com.skillswap.entity.*;
import com.skillswap.exception.BadRequestException;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssessmentBackendService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final IntegrityEventRepository integrityEventRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final ObjectMapper objectMapper;

    public AssessmentBackendService(AssessmentRepository assessmentRepository,
                                    AssessmentAttemptRepository attemptRepository,
                                    IntegrityEventRepository integrityEventRepository,
                                    UserRepository userRepository,
                                    LessonRepository lessonRepository,
                                    LessonProgressRepository lessonProgressRepository,
                                    ObjectMapper objectMapper) {
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.integrityEventRepository = integrityEventRepository;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AssessmentDto getAssessmentByModule(String moduleId) {
        AssessmentEntity entity = assessmentRepository.findByModuleId(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "moduleId", moduleId));
        return mapToAssessmentDto(entity);
    }

    @Transactional
    public AssessmentAttemptDto startAttempt(String assessmentId, String userId) {
        AssessmentEntity assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<AssessmentAttemptEntity> previous = attemptRepository.findByAssessmentIdAndUserIdOrderByStartTimeDesc(assessmentId, userId);
        if (previous.size() >= assessment.getMaxAttempts()) {
            throw new BadRequestException("Maximum attempts (" + assessment.getMaxAttempts() + ") exceeded for this checkpoint assessment");
        }

        AssessmentAttemptEntity attempt = new AssessmentAttemptEntity();
        attempt.setAssessment(assessment);
        attempt.setModuleId(assessment.getModuleId());
        attempt.setUser(user);
        attempt.setAttemptNumber(previous.size() + 1);
        attempt.setStatus("IN_PROGRESS");
        attempt.setTotalPoints(assessment.getQuestions().stream().mapToInt(AssessmentQuestionEntity::getPoints).sum());
        attempt.setStartTime(Instant.now());

        AssessmentAttemptEntity saved = attemptRepository.save(attempt);
        return mapToAttemptDto(saved);
    }

    @Transactional
    public AssessmentAttemptDto recordIntegrityEvent(String attemptId, String userId, RecordIntegrityEventRequest request) {
        AssessmentAttemptEntity attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("AssessmentAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to this assessment attempt");
        }

        IntegrityEventEntity evt = new IntegrityEventEntity(
                attempt,
                request.getEventType(),
                request.getDescription(),
                request.getDurationSeconds()
        );
        integrityEventRepository.save(evt);
        attempt.getIntegrityEvents().add(evt);

        return mapToAttemptDto(attempt);
    }

    @Transactional
    public AssessmentAttemptDto submitAttempt(String attemptId, String userId, SubmitAssessmentRequest request) {
        AssessmentAttemptEntity attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("AssessmentAttempt", "id", attemptId));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to this assessment attempt");
        }

        AssessmentEntity assessment = attempt.getAssessment();
        Map<String, Object> userAnswers = request.getAnswers() != null ? request.getAnswers() : Collections.emptyMap();

        int earnedPoints = 0;
        int totalPoints = assessment.getQuestions().stream().mapToInt(AssessmentQuestionEntity::getPoints).sum();
        List<String> topicsToRevise = new ArrayList<>();

        for (AssessmentQuestionEntity q : assessment.getQuestions()) {
            Object ans = userAnswers.get(q.getId());
            boolean isCorrect = false;

            try {
                List<String> correct = objectMapper.readValue(q.getCorrectAnswersJson(), new TypeReference<List<String>>() {});
                if (ans != null) {
                    if (ans instanceof String && correct.contains(ans.toString().trim())) {
                        isCorrect = true;
                    } else if (ans instanceof List && new HashSet<>((List<?>) ans).equals(new HashSet<>(correct))) {
                        isCorrect = true;
                    }
                }
            } catch (Exception e) {
                // ignore parsing error
            }

            if (isCorrect) {
                earnedPoints += q.getPoints();
            } else if (q.getTopic() != null && !topicsToRevise.contains(q.getTopic())) {
                topicsToRevise.add(q.getTopic());
            }
        }

        int percentage = totalPoints > 0 ? (int) Math.round(((double) earnedPoints / totalPoints) * 100) : 100;
        boolean passed = percentage >= assessment.getPassingScorePercent();

        attempt.setStatus("EVALUATED");
        attempt.setScore(earnedPoints);
        attempt.setTotalPoints(totalPoints);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setEndTime(Instant.now());
        attempt.setTimeTakenSeconds((int) (Instant.now().getEpochSecond() - attempt.getStartTime().getEpochSecond()));

        try {
            attempt.setAnswersJson(objectMapper.writeValueAsString(userAnswers));
            attempt.setTopicsToReviseJson(objectMapper.writeValueAsString(topicsToRevise));
        } catch (Exception ignored) {}

        if (!topicsToRevise.isEmpty()) {
            attempt.setWeakestTopic(topicsToRevise.get(0));
        }

        attempt.setFeedback(passed
                ? "Congratulations! You achieved " + percentage + "%, passing the module checkpoint."
                : "You achieved " + percentage + "%. Focused revision on " + String.join(", ", topicsToRevise) + " is recommended.");

        AssessmentAttemptEntity saved = attemptRepository.save(attempt);
        return mapToAttemptDto(saved);
    }

    @Transactional
    public AssessmentDto linkGoogleForm(LinkGoogleFormRequest request) {
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", request.getLessonId()));

        AssessmentEntity assessment = assessmentRepository.findByModuleId(request.getModuleId())
                .orElseGet(() -> {
                    AssessmentEntity a = new AssessmentEntity();
                    a.setLesson(lesson);
                    a.setModuleId(request.getModuleId());
                    return a;
                });

        assessment.setTitle(request.getTitle() != null ? request.getTitle() : "External Google Form Assessment");
        assessment.setIsExternalGoogleForm(true);
        assessment.setGoogleFormUrl(request.getGoogleFormUrl());

        AssessmentEntity saved = assessmentRepository.save(assessment);
        return mapToAssessmentDto(saved);
    }

    private AssessmentDto mapToAssessmentDto(AssessmentEntity e) {
        AssessmentDto dto = new AssessmentDto();
        dto.setId(e.getId());
        dto.setLessonId(e.getLesson().getId());
        dto.setModuleId(e.getModuleId());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setTimeLimitMinutes(e.getTimeLimitMinutes());
        dto.setPassingScorePercent(e.getPassingScorePercent());
        dto.setMaxAttempts(e.getMaxAttempts());
        dto.setIsExternalGoogleForm(e.getIsExternalGoogleForm());
        dto.setGoogleFormUrl(e.getGoogleFormUrl());

        List<AssessmentDto.QuestionDto> qDtos = new ArrayList<>();
        for (AssessmentQuestionEntity q : e.getQuestions()) {
            List<String> options = new ArrayList<>();
            try {
                if (q.getOptionsJson() != null) {
                    options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}
            qDtos.add(new AssessmentDto.QuestionDto(
                    q.getId(), q.getQuestionText(), q.getQuestionType(), options, q.getTopic(), q.getPoints()
            ));
        }
        dto.setQuestions(qDtos);
        return dto;
    }

    private AssessmentAttemptDto mapToAttemptDto(AssessmentAttemptEntity a) {
        AssessmentAttemptDto dto = new AssessmentAttemptDto();
        dto.setId(a.getId());
        dto.setAssessmentId(a.getAssessment().getId());
        dto.setModuleId(a.getModuleId());
        dto.setAttemptNumber(a.getAttemptNumber());
        dto.setStatus(a.getStatus());
        dto.setScore(a.getScore());
        dto.setTotalPoints(a.getTotalPoints());
        dto.setPercentage(a.getPercentage());
        dto.setPassed(a.getPassed());
        dto.setFeedback(a.getFeedback());
        dto.setWeakestTopic(a.getWeakestTopic());
        dto.setIntegrityEventsCount(a.getIntegrityEvents().size());
        dto.setStartTime(a.getStartTime());
        dto.setEndTime(a.getEndTime());
        dto.setTimeTakenSeconds(a.getTimeTakenSeconds());

        try {
            if (a.getTopicsToReviseJson() != null) {
                dto.setTopicsToRevise(objectMapper.readValue(a.getTopicsToReviseJson(), new TypeReference<List<String>>() {}));
            }
        } catch (Exception ignored) {}

        return dto;
    }
}
