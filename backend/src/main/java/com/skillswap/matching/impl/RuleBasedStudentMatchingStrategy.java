package com.skillswap.matching.impl;

import com.skillswap.dto.response.StudentRecommendationDto;
import com.skillswap.dto.response.UserDto;
import com.skillswap.entity.Profile;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;
import com.skillswap.enums.SkillLevel;
import com.skillswap.enums.SkillType;
import com.skillswap.matching.StudentMatchingStrategy;
import com.skillswap.repository.ProfileRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillRepository;
import com.skillswap.service.UserService;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Deterministic, explainable rule-based student matching strategy.
 * Compares student learning goals against peer teaching skills and profiles,
 * scoring by exact skill match, level compatibility, mutual exchange potential,
 * and campus affinity.
 */
@Component
public class RuleBasedStudentMatchingStrategy implements StudentMatchingStrategy {

    private final UserSkillRepository userSkillRepository;
    private final ProfileRepository profileRepository;
    private final UserService userService;

    public RuleBasedStudentMatchingStrategy(UserSkillRepository userSkillRepository,
                                            ProfileRepository profileRepository,
                                            UserService userService) {
        this.userSkillRepository = userSkillRepository;
        this.profileRepository = profileRepository;
        this.userService = userService;
    }

    @Override
    public List<StudentRecommendationDto> matchStudents(User student,
                                                        List<UserSkill> learningSkills,
                                                        List<UserSkill> teachingSkills,
                                                        int limit) {
        if (student == null || learningSkills == null || learningSkills.isEmpty()) {
            return Collections.emptyList();
        }

        // Set of learning skill names in lowercase for fast matching
        Map<String, UserSkill> learningSkillMap = learningSkills.stream()
                .filter(s -> s.getName() != null && !s.getName().isBlank())
                .collect(Collectors.toMap(
                        s -> s.getName().trim().toLowerCase(),
                        s -> s,
                        (s1, s2) -> s1
                ));

        if (learningSkillMap.isEmpty()) {
            return Collections.emptyList();
        }

        // Student's teaching skills for mutual exchange detection
        Set<String> studentTeachingSkillNames = teachingSkills == null ? Collections.emptySet() :
                teachingSkills.stream()
                        .filter(s -> s.getName() != null && !s.getName().isBlank())
                        .map(s -> s.getName().trim().toLowerCase())
                        .collect(Collectors.toSet());

        // Fetch candidate teaching skills excluding the requesting student
        List<UserSkill> candidateTeachingSkills = userSkillRepository.findBySkillTypeAndUserIdNot(
                SkillType.TEACH, student.getId());

        if (candidateTeachingSkills.isEmpty()) {
            return Collections.emptyList();
        }

        // Group candidate teaching skills by peer User
        Map<User, List<UserSkill>> teacherSkillsMap = new HashMap<>();
        for (UserSkill us : candidateTeachingSkills) {
            User peer = us.getUser();
            if (peer != null && !peer.getId().equals(student.getId())) {
                teacherSkillsMap.computeIfAbsent(peer, k -> new ArrayList<>()).add(us);
            }
        }

        List<StudentRecommendationDto> recommendations = new ArrayList<>();

        for (Map.Entry<User, List<UserSkill>> entry : teacherSkillsMap.entrySet()) {
            User candidate = entry.getKey();
            List<UserSkill> candidateSkills = entry.getValue();

            // Find matching skills
            List<UserSkill> matchingCandidateSkills = new ArrayList<>();
            List<UserSkill> correspondingLearnerSkills = new ArrayList<>();

            for (UserSkill cs : candidateSkills) {
                if (cs.getName() != null) {
                    String normName = cs.getName().trim().toLowerCase();
                    if (learningSkillMap.containsKey(normName)) {
                        matchingCandidateSkills.add(cs);
                        correspondingLearnerSkills.add(learningSkillMap.get(normName));
                    }
                }
            }

            // Must match at least one desired skill
            if (matchingCandidateSkills.isEmpty()) {
                continue;
            }

            double totalScore = 0.0;
            List<String> matchedSkillNames = new ArrayList<>();
            List<String> matchingReasons = new ArrayList<>();

            // 1. Exact Skill Match Factor (40 pts for first, +15 for each additional, max 60)
            int matchCount = matchingCandidateSkills.size();
            double skillMatchScore = 40.0 + Math.min(20.0, (matchCount - 1) * 15.0);
            totalScore += skillMatchScore;

            for (UserSkill matchedSkill : matchingCandidateSkills) {
                matchedSkillNames.add(matchedSkill.getName());
                matchingReasons.add("Teaches " + matchedSkill.getName() + " (" +
                        (matchedSkill.getSkillLevel() != null ? matchedSkill.getSkillLevel().name() : "Intermediate") +
                        "), matching a skill you want to learn.");
            }

            // 2. Skill Level Compatibility (+10 to +20 pts)
            boolean hasLevelBonus = false;
            for (int i = 0; i < matchingCandidateSkills.size(); i++) {
                UserSkill teacherSkill = matchingCandidateSkills.get(i);
                UserSkill learnerSkill = correspondingLearnerSkills.get(i);

                SkillLevel tLevel = teacherSkill.getSkillLevel() != null ? teacherSkill.getSkillLevel() : SkillLevel.Intermediate;
                SkillLevel lTarget = learnerSkill.getTargetLevel() != null ? learnerSkill.getTargetLevel() :
                        (learnerSkill.getSkillLevel() != null ? learnerSkill.getSkillLevel() : SkillLevel.Beginner);

                if (tLevel.ordinal() >= lTarget.ordinal()) {
                    totalScore += 20.0;
                    matchingReasons.add("Teacher level (" + tLevel.name() + ") meets or exceeds your learning target (" + lTarget.name() + ") in " + teacherSkill.getName() + ".");
                    hasLevelBonus = true;
                    break; // Count top level compatibility once for score balance
                } else if (tLevel.ordinal() >= learnerSkill.getSkillLevel().ordinal()) {
                    totalScore += 12.0;
                    matchingReasons.add("Teacher level (" + tLevel.name() + ") can guide your current " + learnerSkill.getSkillLevel().name() + " stage in " + teacherSkill.getName() + ".");
                    hasLevelBonus = true;
                    break;
                }
            }
            if (!hasLevelBonus) {
                totalScore += 5.0; // Peer co-learning base
            }

            // 3. Mutual Swap / Reciprocal Exchange Factor (+15 pts)
            boolean isMutualMatch = false;
            List<String> mutualSkills = new ArrayList<>();
            if (!studentTeachingSkillNames.isEmpty()) {
                List<UserSkill> candidateLearnSkills = userSkillRepository.findByUserIdAndSkillType(candidate.getId(), SkillType.LEARN);
                for (UserSkill cls : candidateLearnSkills) {
                    if (cls.getName() != null && studentTeachingSkillNames.contains(cls.getName().trim().toLowerCase())) {
                        isMutualMatch = true;
                        mutualSkills.add(cls.getName());
                    }
                }
                if (isMutualMatch) {
                    totalScore += 15.0;
                    matchingReasons.add("Mutual swap opportunity: this peer wants to learn " +
                            String.join(", ", mutualSkills) + ", which you are able to teach.");
                }
            }

            // 4. University & Department Compatibility (+5 to +10 pts)
            if (student.getUniversity() != null && candidate.getUniversity() != null &&
                    student.getUniversity().trim().equalsIgnoreCase(candidate.getUniversity().trim())) {
                totalScore += 10.0;
                matchingReasons.add("Both attend " + student.getUniversity() + " for convenient campus collaboration.");
            }
            if (student.getDepartment() != null && candidate.getDepartment() != null &&
                    student.getDepartment().trim().equalsIgnoreCase(candidate.getDepartment().trim())) {
                totalScore += 5.0;
                matchingReasons.add("Shared academic background in " + student.getDepartment() + ".");
            }

            // 5. Peer Reputation & Verification (+5 to +10 pts)
            Profile peerProfile = profileRepository.findById(candidate.getId()).orElse(null);
            if (peerProfile != null && peerProfile.getPeerReputation() != null &&
                    peerProfile.getPeerReputation().doubleValue() >= 4.5) {
                totalScore += 5.0;
                matchingReasons.add("High peer review rating (" + peerProfile.getPeerReputation() + "/5.0).");
            }
            if (Boolean.TRUE.equals(candidate.getIsVerified())) {
                totalScore += 5.0;
                matchingReasons.add("Verified university student badge.");
            }

            // Clamp normalized score to 100.0
            double normalizedScore = Math.min(100.0, Math.round(totalScore * 10.0) / 10.0);

            UserDto candidateDto = userService.mapToDto(candidate);
            String summary = String.format("Matches %d skill(s) with %s campus alignment.",
                    matchedSkillNames.size(),
                    isMutualMatch ? "mutual two-way exchange and" : "strong");

            recommendations.add(new StudentRecommendationDto(
                    candidateDto,
                    normalizedScore,
                    matchedSkillNames,
                    matchingReasons,
                    isMutualMatch,
                    mutualSkills,
                    summary
            ));
        }

        // Sort descending by matchScore
        recommendations.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));

        // Return up to limit
        int finalLimit = limit > 0 ? Math.min(limit, recommendations.size()) : recommendations.size();
        return recommendations.subList(0, finalLimit);
    }
}
