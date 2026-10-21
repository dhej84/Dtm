package com.skillswap.service;

import com.skillswap.dto.request.CreateLessonRequest;
import com.skillswap.dto.request.UpdateLessonRequest;
import com.skillswap.dto.request.UpdateProgressRequest;
import com.skillswap.dto.response.CommentDto;
import com.skillswap.dto.response.LessonDetailDto;
import com.skillswap.dto.response.LessonDto;
import com.skillswap.dto.response.LessonProgressDto;
import com.skillswap.entity.*;
import com.skillswap.enums.SkillLevel;
import com.skillswap.exception.BadRequestException;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.CommentLikeRepository;
import com.skillswap.repository.LessonProgressRepository;
import com.skillswap.repository.LessonRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserService userService;

    public LessonService(LessonRepository lessonRepository,
                         LessonProgressRepository lessonProgressRepository,
                         UserRepository userRepository,
                         CommentLikeRepository commentLikeRepository,
                         UserService userService) {
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.userService = userService;
    }

    public LessonDto mapToDto(Lesson lesson) {
        if (lesson == null) return null;
        LessonDto dto = new LessonDto();
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setSkill(lesson.getSkill());
        dto.setCategory(lesson.getCategory());
        dto.setDescription(lesson.getDescription());
        dto.setSkillLevel(lesson.getSkillLevel() != null ? lesson.getSkillLevel().name() : "Intermediate");
        dto.setFormat(lesson.getFormat() != null ? lesson.getFormat().getDisplayName() : "Interactive Workshop");
        dto.setTeacher(userService.mapToDto(lesson.getTeacher()));
        dto.setDurationMinutes(lesson.getDurationMinutes());
        dto.setCreditsRequired(lesson.getCreditsRequired());
        dto.setPrerequisites(lesson.getPrerequisites());
        dto.setEnrolledStudentsCount(lesson.getEnrolledStudentsCount());
        dto.setCreatedAt(lesson.getCreatedAt());
        dto.setUpdatedAt(lesson.getUpdatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<LessonDto> getAllLessons(String query, String category, String skillLevel, String skill, String teacherId) {
        List<Lesson> lessons;
        if (teacherId != null && !teacherId.isBlank()) {
            lessons = lessonRepository.findByTeacherId(teacherId);
        } else {
            SkillLevel level = null;
            if (skillLevel != null && !skillLevel.isBlank()) {
                try {
                    level = SkillLevel.valueOf(skillLevel.toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
            String cleanQuery = (query != null && !query.isBlank()) ? query.trim() : null;
            String cleanCategory = (category != null && !category.isBlank()) ? category.trim() : null;
            String cleanSkill = (skill != null && !skill.isBlank()) ? skill.trim() : null;

            if (cleanQuery == null && cleanCategory == null && cleanSkill == null && level == null) {
                lessons = lessonRepository.findAll();
            } else {
                lessons = lessonRepository.filterLessons(cleanQuery, cleanSkill, level, cleanCategory);
            }
        }

        return lessons.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<LessonDto> getAllLessons(String query, String category, String skillLevel, String teacherId) {
        return getAllLessons(query, category, skillLevel, null, teacherId);
    }

    @Transactional(readOnly = true)
    public LessonDetailDto getLessonDetail(String lessonId, String currentUserId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));

        LessonDetailDto dto = new LessonDetailDto();
        dto.setId(lesson.getId());
        dto.setTitle(lesson.getTitle());
        dto.setSkill(lesson.getSkill());
        dto.setCategory(lesson.getCategory());
        dto.setDescription(lesson.getDescription());
        dto.setSkillLevel(lesson.getSkillLevel() != null ? lesson.getSkillLevel().name() : "Intermediate");
        dto.setFormat(lesson.getFormat() != null ? lesson.getFormat().getDisplayName() : "Interactive Workshop");
        dto.setTeacher(userService.mapToDto(lesson.getTeacher()));
        dto.setDurationMinutes(lesson.getDurationMinutes());
        dto.setCreditsRequired(lesson.getCreditsRequired());
        dto.setPrerequisites(lesson.getPrerequisites());
        dto.setEnrolledStudentsCount(lesson.getEnrolledStudentsCount());
        dto.setCreatedAt(lesson.getCreatedAt());
        dto.setUpdatedAt(lesson.getUpdatedAt());

        // Modules
        dto.setModules(lesson.getModules().stream().map(m -> {
            LessonDetailDto.LessonModuleDto md = new LessonDetailDto.LessonModuleDto();
            md.setId(m.getId());
            md.setTitle(m.getTitle());
            md.setDuration(m.getDuration());
            md.setSequenceOrder(m.getSequenceOrder());
            md.setDescription(m.getDescription());
            md.setContentSnippet(m.getContentSnippet());
            return md;
        }).collect(Collectors.toList()));

        // Resources
        dto.setResources(lesson.getResources().stream().map(r -> {
            LessonDetailDto.LessonResourceDto rd = new LessonDetailDto.LessonResourceDto();
            rd.setId(r.getId());
            rd.setName(r.getName());
            rd.setSize(r.getSize());
            rd.setResourceType(r.getResourceType());
            rd.setUrl(r.getUrl());
            return rd;
        }).collect(Collectors.toList()));

        // Comments
        dto.setComments(lesson.getComments().stream().map(c -> {
            CommentDto cd = new CommentDto();
            cd.setId(c.getId());
            cd.setLessonId(lesson.getId());
            cd.setAuthor(userService.mapToDto(c.getAuthor()));
            cd.setText(c.getText());
            cd.setLikes(c.getLikes());
            cd.setLikedByCurrentUser(currentUserId != null &&
                    commentLikeRepository.existsByCommentIdAndUserId(c.getId(), currentUserId));
            cd.setCreatedAt(c.getCreatedAt());
            cd.setUpdatedAt(c.getUpdatedAt());
            return cd;
        }).collect(Collectors.toList()));

        // User Progress if user is authenticated
        if (currentUserId != null) {
            lessonProgressRepository.findByLessonIdAndUserId(lessonId, currentUserId)
                    .ifPresent(p -> dto.setUserProgress(mapToProgressDto(p)));
        }

        return dto;
    }

    @Transactional
    public LessonDto createLesson(String teacherId, CreateLessonRequest request) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", teacherId));

        Lesson lesson = new Lesson();
        lesson.setTitle(request.getTitle().trim());
        lesson.setSkill(request.getSkill().trim());
        lesson.setCategory(request.getCategory() != null ? request.getCategory() : "General");
        lesson.setDescription(request.getDescription());
        lesson.setSkillLevel(request.getSkillLevel());
        lesson.setFormat(request.getFormat());
        lesson.setTeacher(teacher);
        lesson.setDurationMinutes(request.getDurationMinutes());
        lesson.setCreditsRequired(request.getCreditsRequired());
        lesson.setPrerequisites(request.getPrerequisites());

        if (request.getModules() != null) {
            int seq = 1;
            for (CreateLessonRequest.ModuleDto mDto : request.getModules()) {
                LessonModule mod = new LessonModule();
                mod.setTitle(mDto.getTitle());
                mod.setDuration(mDto.getDuration());
                mod.setSequenceOrder(mDto.getSequenceOrder() != null ? mDto.getSequenceOrder() : seq++);
                mod.setDescription(mDto.getDescription());
                mod.setContentSnippet(mDto.getContentSnippet());
                lesson.addModule(mod);
            }
        }

        Lesson saved = lessonRepository.save(lesson);
        return mapToDto(saved);
    }

    @Transactional
    public LessonDto updateLesson(String lessonId, String currentUserId, UpdateLessonRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));

        if (!lesson.getTeacher().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the teacher can update this lesson");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            lesson.setTitle(request.getTitle().trim());
        }
        if (request.getSkill() != null && !request.getSkill().isBlank()) {
            lesson.setSkill(request.getSkill().trim());
        }
        if (request.getCategory() != null) {
            lesson.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            lesson.setDescription(request.getDescription());
        }
        if (request.getSkillLevel() != null) {
            lesson.setSkillLevel(request.getSkillLevel());
        }
        if (request.getFormat() != null) {
            lesson.setFormat(request.getFormat());
        }
        if (request.getDurationMinutes() != null) {
            lesson.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getCreditsRequired() != null) {
            lesson.setCreditsRequired(request.getCreditsRequired());
        }
        if (request.getPrerequisites() != null) {
            lesson.setPrerequisites(request.getPrerequisites());
        }

        if (request.getModules() != null) {
            lesson.getModules().clear();
            int seq = 1;
            for (CreateLessonRequest.ModuleDto mDto : request.getModules()) {
                LessonModule mod = new LessonModule();
                mod.setTitle(mDto.getTitle());
                mod.setDuration(mDto.getDuration());
                mod.setSequenceOrder(mDto.getSequenceOrder() != null ? mDto.getSequenceOrder() : seq++);
                mod.setDescription(mDto.getDescription());
                mod.setContentSnippet(mDto.getContentSnippet());
                lesson.addModule(mod);
            }
        }

        lesson.setUpdatedAt(Instant.now());
        Lesson updated = lessonRepository.save(lesson);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteLesson(String lessonId, String currentUserId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));

        if (!lesson.getTeacher().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the teacher can delete this lesson");
        }

        lessonRepository.delete(lesson);
    }

    @Transactional
    public LessonProgressDto enrollInLesson(String lessonId, String userId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        LessonProgress progress = lessonProgressRepository.findByLessonIdAndUserId(lessonId, userId)
                .orElseGet(() -> {
                    LessonProgress newProg = new LessonProgress(lesson, user);
                    newProg.setProgressPercent(0);
                    newProg.setIsCompleted(false);
                    newProg.setCompletionStatus("IN_PROGRESS");
                    newProg.setStartedAt(Instant.now());
                    lesson.setEnrolledStudentsCount(lesson.getEnrolledStudentsCount() + 1);
                    lessonRepository.save(lesson);
                    return lessonProgressRepository.save(newProg);
                });

        return mapToProgressDto(progress);
    }

    @Transactional(readOnly = true)
    public LessonProgressDto getProgress(String lessonId, String userId) {
        LessonProgress progress = lessonProgressRepository.findByLessonIdAndUserId(lessonId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("LessonProgress not found for student on lesson: " + lessonId));
        return mapToProgressDto(progress);
    }

    @Transactional
    public LessonProgressDto updateProgress(String lessonId, String userId, UpdateProgressRequest request) {
        LessonProgress progress = lessonProgressRepository.findByLessonIdAndUserId(lessonId, userId)
                .orElseGet(() -> {
                    Lesson lesson = lessonRepository.findById(lessonId)
                            .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", lessonId));
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    LessonProgress np = new LessonProgress(lesson, user);
                    np.setStartedAt(Instant.now());
                    return np;
                });

        if (request.getProgressPercent() != null) {
            progress.setProgressPercent(request.getProgressPercent());
            if (request.getProgressPercent() >= 100) {
                progress.setIsCompleted(true);
                progress.setCompletionStatus("COMPLETED");
                if (progress.getCompletedAt() == null) {
                    progress.setCompletedAt(Instant.now());
                }
            }
        }

        if (request.getIsCompleted() != null) {
            progress.setIsCompleted(request.getIsCompleted());
            if (Boolean.TRUE.equals(request.getIsCompleted())) {
                progress.setCompletionStatus("COMPLETED");
                progress.setProgressPercent(100);
                if (progress.getCompletedAt() == null) {
                    progress.setCompletedAt(Instant.now());
                }
            } else {
                progress.setCompletionStatus("IN_PROGRESS");
            }
        }

        if (request.getCompletionStatus() != null) {
            progress.setCompletionStatus(request.getCompletionStatus());
        }

        if (request.getUserNotes() != null) {
            progress.setUserNotes(request.getUserNotes());
        }

        if (request.getCurrentStepIndex() != null) {
            progress.setCurrentStepIndex(request.getCurrentStepIndex());
        }

        if (request.getCompletedModuleIds() != null) {
            progress.setCompletedModuleIds(request.getCompletedModuleIds());
        }

        progress.setLastAccessedAt(Instant.now());
        LessonProgress saved = lessonProgressRepository.save(progress);
        return mapToProgressDto(saved);
    }

    @Transactional(readOnly = true)
    public List<LessonProgressDto> getAllUserProgress(String userId) {
        return lessonProgressRepository.findByUserId(userId).stream()
                .map(this::mapToProgressDto)
                .collect(Collectors.toList());
    }

    public LessonProgressDto mapToProgressDto(LessonProgress progress) {
        if (progress == null) return null;
        LessonProgressDto dto = new LessonProgressDto();
        dto.setId(progress.getId());
        dto.setLessonId(progress.getLesson().getId());
        dto.setLessonTitle(progress.getLesson().getTitle());
        dto.setStudentId(progress.getUser().getId());
        dto.setStudentName(progress.getUser().getName());
        dto.setProgressPercent(progress.getProgressPercent());
        dto.setIsCompleted(progress.getIsCompleted());
        dto.setCompletionStatus(progress.getCompletionStatus());
        dto.setUserNotes(progress.getUserNotes());
        dto.setCurrentStepIndex(progress.getCurrentStepIndex());
        dto.setCompletedModuleIds(progress.getCompletedModuleIds());
        dto.setStartedAt(progress.getStartedAt());
        dto.setCompletedAt(progress.getCompletedAt());
        dto.setLastAccessedAt(progress.getLastAccessedAt());
        dto.setUpdatedAt(progress.getUpdatedAt());
        return dto;
    }
}
