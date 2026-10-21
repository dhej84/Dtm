package com.skillswap.service;

import com.skillswap.dto.response.*;
import com.skillswap.entity.*;
import com.skillswap.enums.ConnectionStatus;
import com.skillswap.enums.SkillType;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.matching.LessonRecommendationStrategy;
import com.skillswap.matching.StudentMatchingStrategy;
import com.skillswap.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final StudentMatchingStrategy studentMatchingStrategy;
    private final LessonRecommendationStrategy lessonRecommendationStrategy;
    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final ConnectionRepository connectionRepository;
    private final ConversationRepository conversationRepository;
    private final UserService userService;

    public RecommendationService(StudentMatchingStrategy studentMatchingStrategy,
                                 LessonRecommendationStrategy lessonRecommendationStrategy,
                                 UserRepository userRepository,
                                 UserSkillRepository userSkillRepository,
                                 LessonRepository lessonRepository,
                                 LessonProgressRepository lessonProgressRepository,
                                 ConnectionRepository connectionRepository,
                                 ConversationRepository conversationRepository,
                                 UserService userService) {
        this.studentMatchingStrategy = studentMatchingStrategy;
        this.lessonRecommendationStrategy = lessonRecommendationStrategy;
        this.userRepository = userRepository;
        this.userSkillRepository = userSkillRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.connectionRepository = connectionRepository;
        this.conversationRepository = conversationRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<StudentRecommendationDto> getRecommendedMentors(String currentUserId,
                                                                 String filterSkill,
                                                                 String filterLevel,
                                                                 String filterLanguage,
                                                                 int limit) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        List<UserSkill> learningSkills = userSkillRepository.findByUserIdAndSkillType(currentUserId, SkillType.LEARN);
        List<UserSkill> teachingSkills = userSkillRepository.findByUserIdAndSkillType(currentUserId, SkillType.TEACH);

        if (filterSkill != null && !filterSkill.isBlank() && !filterSkill.equalsIgnoreCase("All")) {
            learningSkills = learningSkills.stream()
                    .filter(s -> s.getName() != null && s.getName().toLowerCase().contains(filterSkill.toLowerCase()))
                    .collect(Collectors.toList());
        }

        List<StudentRecommendationDto> recommendations = studentMatchingStrategy.matchStudents(
                user, learningSkills, teachingSkills, limit > 0 ? limit : 10);

        return recommendations;
    }

    @Transactional(readOnly = true)
    public List<StudentRecommendationDto> getRecommendedLearners(String currentUserId, int limit) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        List<UserSkill> teachingSkills = userSkillRepository.findByUserIdAndSkillType(currentUserId, SkillType.TEACH);
        if (teachingSkills.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> teachNames = teachingSkills.stream()
                .filter(s -> s.getName() != null)
                .map(s -> s.getName().trim().toLowerCase())
                .collect(Collectors.toSet());

        List<UserSkill> candidateLearners = userSkillRepository.findBySkillTypeAndUserIdNot(SkillType.LEARN, currentUserId);

        Map<User, List<UserSkill>> learnerMap = new HashMap<>();
        for (UserSkill us : candidateLearners) {
            if (us.getName() != null && teachNames.contains(us.getName().trim().toLowerCase())) {
                User peer = us.getUser();
                if (peer != null && !peer.getId().equals(currentUserId)) {
                    learnerMap.computeIfAbsent(peer, k -> new ArrayList<>()).add(us);
                }
            }
        }

        List<StudentRecommendationDto> dtos = new ArrayList<>();
        for (Map.Entry<User, List<UserSkill>> entry : learnerMap.entrySet()) {
            User candidate = entry.getKey();
            List<UserSkill> matched = entry.getValue();

            double score = Math.min(100.0, 60.0 + matched.size() * 15.0);
            List<String> matchedSkills = matched.stream().map(UserSkill::getName).collect(Collectors.toList());
            List<String> reasons = List.of(
                    "Actively seeking to learn " + String.join(", ", matchedSkills),
                    "Motivated student peer from " + (candidate.getDepartment() != null ? candidate.getDepartment() : "Campus")
            );

            dtos.add(new StudentRecommendationDto(
                    userService.mapToDto(candidate),
                    score,
                    matchedSkills,
                    reasons,
                    false,
                    Collections.emptyList(),
                    "Seeking to learn skills you teach."
            ));
        }

        dtos.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));
        return limit > 0 && limit < dtos.size() ? dtos.subList(0, limit) : dtos;
    }

    @Transactional(readOnly = true)
    public List<LessonRecommendationDto> getRecommendedLessons(String currentUserId,
                                                               String category,
                                                               String level,
                                                               boolean includeCompleted,
                                                               int limit) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        List<UserSkill> learningSkills = userSkillRepository.findByUserIdAndSkillType(currentUserId, SkillType.LEARN);

        // Fetch completed lesson IDs
        List<LessonProgress> progresses = lessonProgressRepository.findByUserId(currentUserId);
        Set<String> completedIds = progresses.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsCompleted()))
                .map(LessonProgress::getLessonId)
                .collect(Collectors.toSet());

        List<LessonRecommendationDto> recs = lessonRecommendationStrategy.recommendLessons(
                user, learningSkills, completedIds, includeCompleted, limit > 0 ? limit : 10);

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("All")) {
            recs = recs.stream()
                    .filter(r -> r.getLesson() != null && category.equalsIgnoreCase(r.getLesson().getCategory()))
                    .collect(Collectors.toList());
        }

        if (level != null && !level.isBlank() && !level.equalsIgnoreCase("All")) {
            recs = recs.stream()
                    .filter(r -> r.getLesson() != null && level.equalsIgnoreCase(r.getLesson().getSkillLevel()))
                    .collect(Collectors.toList());
        }

        return recs;
    }

    @Transactional(readOnly = true)
    public List<SkillGapDto> getSkillGaps(String currentUserId) {
        List<UserSkill> learningSkills = userSkillRepository.findByUserIdAndSkillType(currentUserId, SkillType.LEARN);
        List<LessonProgress> progresses = lessonProgressRepository.findByUserId(currentUserId);

        List<SkillGapDto> gaps = new ArrayList<>();

        for (UserSkill ls : learningSkills) {
            String skillName = ls.getName();
            int completedCount = 0;
            for (LessonProgress lp : progresses) {
                if (Boolean.TRUE.equals(lp.getIsCompleted())) {
                    completedCount++;
                }
            }

            List<String> nextSteps = new ArrayList<>();
            nextSteps.add("Complete foundational module walkthroughs in " + skillName);
            nextSteps.add("Schedule a 1-on-1 swap practice session with a peer mentor");
            nextSteps.add("Solve practical code challenges to reach " + (ls.getTargetLevel() != null ? ls.getTargetLevel().name() : "Mastery"));

            String gapDesc = String.format("Advancing from %s to %s requires focused curriculum milestones.",
                    ls.getSkillLevel() != null ? ls.getSkillLevel().name() : "Beginner",
                    ls.getTargetLevel() != null ? ls.getTargetLevel().name() : "Mastery");

            gaps.add(new SkillGapDto(
                    skillName,
                    ls.getCategory() != null ? ls.getCategory() : "General",
                    ls.getSkillLevel() != null ? ls.getSkillLevel().name() : "Beginner",
                    ls.getTargetLevel() != null ? ls.getTargetLevel().name() : "Mastery",
                    gapDesc,
                    nextSteps,
                    completedCount,
                    completedCount > 0
            ));
        }

        return gaps;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMatchExplanation(String currentUserId, String candidateId) {
        User student = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        User candidate = userRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", candidateId));

        List<UserSkill> learningSkills = userSkillRepository.findByUserIdAndSkillType(currentUserId, SkillType.LEARN);
        List<UserSkill> teachingSkills = userSkillRepository.findByUserIdAndSkillType(candidateId, SkillType.TEACH);

        Set<String> learnerWants = learningSkills.stream()
                .filter(s -> s.getName() != null)
                .map(s -> s.getName().trim().toLowerCase())
                .collect(Collectors.toSet());

        List<String> matchedSkills = new ArrayList<>();
        for (UserSkill ts : teachingSkills) {
            if (ts.getName() != null && learnerWants.contains(ts.getName().trim().toLowerCase())) {
                matchedSkills.add(ts.getName());
            }
        }

        List<Map<String, Object>> factors = new ArrayList<>();

        int skillPts = matchedSkills.isEmpty() ? 15 : Math.min(40, 30 + (matchedSkills.size() - 1) * 10);
        factors.add(Map.of(
                "name", "Direct Skill Match Factor",
                "score", skillPts,
                "maxScore", 40,
                "description", matchedSkills.isEmpty()
                        ? "General academic alignment in related collegiate fields."
                        : "Candidate teaches " + String.join(", ", matchedSkills) + ", directly matching your learning goals."
        ));

        factors.add(Map.of(
                "name", "Proficiency Level Compatibility",
                "score", 18,
                "maxScore", 20,
                "description", "Candidate has advanced skill depth suitable for mentoring your target level."
        ));

        factors.add(Map.of(
                "name", "Active Learning Context Fit",
                "score", 14,
                "maxScore", 15,
                "description", "Relevant to your current active workshop modules and algorithm problems."
        ));

        factors.add(Map.of(
                "name", "Campus Affinity & Peer Reputation",
                "score", 12,
                "maxScore", 15,
                "description", "Verified university peer with high ratings."
        ));

        factors.add(Map.of(
                "name", "Language & Code-Mixing Support",
                "score", 10,
                "maxScore", 10,
                "description", "Shared communication comfort for collegiate discussions."
        ));

        int totalScore = factors.stream().mapToInt(f -> (int) f.get("score")).sum();

        Map<String, Object> result = new HashMap<>();
        result.put("candidateId", candidateId);
        result.put("candidateName", candidate.getName());
        result.put("overallScore", totalScore);
        result.put("factorBreakdown", factors);
        result.put("summary", String.format("Recommended because candidate teaches %s with strong campus alignment.",
                matchedSkills.isEmpty() ? "complementary skills" : String.join(", ", matchedSkills)));

        return result;
    }
}
