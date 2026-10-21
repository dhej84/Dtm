package com.skillswap.service;

import com.skillswap.dto.request.AddSkillRequest;
import com.skillswap.dto.request.PrivacySettingsDto;
import com.skillswap.dto.request.ProfileUpdateRequest;
import com.skillswap.dto.request.UpdateSkillLevelRequest;
import com.skillswap.dto.response.*;
import com.skillswap.entity.*;
import com.skillswap.enums.SkillType;
import com.skillswap.exception.DuplicateResourceException;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final SkillRepository skillRepository;
    private final LessonRepository lessonRepository;

    public UserService(UserRepository userRepository,
                       ProfileRepository profileRepository,
                       UserSkillRepository userSkillRepository,
                       UserAchievementRepository userAchievementRepository,
                       SkillRepository skillRepository,
                       LessonRepository lessonRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userSkillRepository = userSkillRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.skillRepository = skillRepository;
        this.lessonRepository = lessonRepository;
    }

    public UserDto mapToDto(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setUniversity(user.getUniversity());
        dto.setDepartment(user.getDepartment());
        dto.setYear(user.getYear());
        dto.setIsVerified(user.getIsVerified());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public UserDto getUserDtoById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToDto(user);
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfileByUserId(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Profile profile = profileRepository.findById(userId)
                .orElseGet(() -> {
                    Profile p = new Profile(user);
                    p.setPublicProfileId(generateUniquePublicProfileId());
                    p.setPublicProfileEnabled(true);
                    return profileRepository.save(p);
                });

        // Ensure publicProfileId is generated if missing
        if (profile.getPublicProfileId() == null || profile.getPublicProfileId().trim().isEmpty()) {
            profile.setPublicProfileId(generateUniquePublicProfileId());
            if (profile.getPublicProfileEnabled() == null) {
                profile.setPublicProfileEnabled(true);
            }
            profile = profileRepository.save(profile);
        }

        ProfileDto dto = new ProfileDto();
        dto.setId(profile.getId());
        dto.setUser(mapToDto(user));
        dto.setBio(profile.getBio());
        dto.setLocation(profile.getLocation());
        dto.setRank(profile.getRank());
        dto.setMemberSince(profile.getMemberSince());
        dto.setProfileVisibility(profile.getProfileVisibility());
        dto.setWalletBalance(profile.getWalletBalance());
        dto.setHoursTaught(profile.getHoursTaught());
        dto.setHoursLearned(profile.getHoursLearned());
        dto.setPeerReputation(profile.getPeerReputation());
        dto.setReviewCount(profile.getReviewCount());
        dto.setSwapFulfillRate(profile.getSwapFulfillRate());
        dto.setVerifiedPeersOnly(profile.getVerifiedPeersOnly());
        dto.setAllowDirectSwaps(profile.getAllowDirectSwaps());
        dto.setPublicLearningHistory(profile.getPublicLearningHistory());
        dto.setMaskReviews(profile.getMaskReviews());
        dto.setPublicProfileId(profile.getPublicProfileId());
        dto.setPublicProfileEnabled(profile.getPublicProfileEnabled() != null ? profile.getPublicProfileEnabled() : true);
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());

        dto.setTeachingSkills(getTeachingSkills(userId));
        dto.setLearningSkills(getLearningSkills(userId));

        return dto;
    }

    private String generateUniquePublicProfileId() {
        return "pub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    @Transactional
    public ProfileDto updateProfile(String userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Profile profile = profileRepository.findById(userId)
                .orElseGet(() -> new Profile(user));

        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getLocation() != null) profile.setLocation(request.getLocation());
        if (request.getProfileVisibility() != null) profile.setProfileVisibility(request.getProfileVisibility());
        if (request.getVerifiedPeersOnly() != null) profile.setVerifiedPeersOnly(request.getVerifiedPeersOnly());
        if (request.getAllowDirectSwaps() != null) profile.setAllowDirectSwaps(request.getAllowDirectSwaps());
        if (request.getPublicLearningHistory() != null) profile.setPublicLearningHistory(request.getPublicLearningHistory());
        if (request.getMaskReviews() != null) profile.setMaskReviews(request.getMaskReviews());

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
            userRepository.save(user);
        }

        profileRepository.save(profile);
        return getProfileByUserId(userId);
    }

    @Transactional
    public ProfileDto updatePrivacySettings(String userId, PrivacySettingsDto request) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));

        if (request.getVerifiedPeersOnly() != null) profile.setVerifiedPeersOnly(request.getVerifiedPeersOnly());
        if (request.getAllowDirectSwaps() != null) profile.setAllowDirectSwaps(request.getAllowDirectSwaps());
        if (request.getPublicLearningHistory() != null) profile.setPublicLearningHistory(request.getPublicLearningHistory());
        if (request.getMaskReviews() != null) profile.setMaskReviews(request.getMaskReviews());
        if (request.getPublicProfileEnabled() != null) profile.setPublicProfileEnabled(request.getPublicProfileEnabled());

        profileRepository.save(profile);
        return getProfileByUserId(userId);
    }

    @Transactional
    public String regeneratePublicProfileId(String userId) {
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));

        String newPublicId = generateUniquePublicProfileId();
        profile.setPublicProfileId(newPublicId);
        profileRepository.save(profile);
        return newPublicId;
    }

    @Transactional(readOnly = true)
    public PublicProfileDto getPublicProfile(String publicProfileId) {
        if (publicProfileId == null || publicProfileId.trim().isEmpty()) {
            throw new ResourceNotFoundException("PublicProfile", "id", publicProfileId);
        }

        Profile profile = profileRepository.findByPublicProfileId(publicProfileId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("PublicProfile", "id", publicProfileId));

        // Check whether public profile sharing is enabled
        Boolean enabled = profile.getPublicProfileEnabled();
        if (enabled != null && !enabled) {
            // Respect privacy: do not reveal private info if disabled
            throw new ResourceNotFoundException("PublicProfile", "id", publicProfileId);
        }

        User user = profile.getUser();
        if (user == null && profile.getId() != null) {
            user = userRepository.findById(profile.getId()).orElse(null);
        }

        PublicProfileDto dto = new PublicProfileDto();
        dto.setPublicProfileId(profile.getPublicProfileId());
        dto.setName(user != null ? user.getName() : "Campus Student");
        dto.setAvatarUrl(user != null ? user.getAvatarUrl() : "");
        dto.setBio(profile.getBio());
        dto.setUniversity(user != null ? user.getUniversity() : null);
        dto.setDepartment(user != null ? user.getDepartment() : null);
        dto.setYear(user != null ? user.getYear() : null);
        dto.setLocation(profile.getLocation());
        dto.setRank(profile.getRank());
        dto.setMemberSince(profile.getMemberSince());
        dto.setIsVerified(user != null && Boolean.TRUE.equals(user.getIsVerified()));
        dto.setPublicProfileEnabled(true);

        boolean showLearningHistory = Boolean.TRUE.equals(profile.getPublicLearningHistory());
        dto.setPublicLearningHistory(showLearningHistory);

        // Teaching skills (Always public when profile is public)
        String userId = profile.getId();
        List<UserSkill> teachingSkills = userSkillRepository.findByUserIdAndSkillType(userId, SkillType.TEACH);
        dto.setTeachingSkills(teachingSkills.stream().map(s -> new PublicProfileDto.PublicSkillItem(
                s.getName(),
                s.getCategory(),
                s.getSkillLevel() != null ? s.getSkillLevel().name() : "Intermediate",
                s.getDescription(),
                s.getEndorsementsCount(),
                s.getHoursTaught()
        )).collect(Collectors.toList()));

        // Learning skills (Conditional based on publicLearningHistory)
        if (showLearningHistory) {
            List<UserSkill> learningSkills = userSkillRepository.findByUserIdAndSkillType(userId, SkillType.LEARN);
            dto.setLearningSkills(learningSkills.stream().map(s -> new PublicProfileDto.PublicSkillItem(
                    s.getName(),
                    s.getCategory(),
                    s.getSkillLevel() != null ? s.getSkillLevel().name() : "Beginner",
                    s.getDescription(),
                    s.getEndorsementsCount(),
                    null
            )).collect(Collectors.toList()));

            // Achievements / Badges (Conditional)
            List<UserAchievement> achievements = userAchievementRepository.findByUserId(userId);
            dto.setAchievements(achievements.stream().map(ua -> {
                Achievement a = ua.getAchievement();
                return new PublicProfileDto.PublicAchievementItem(
                        a.getId(),
                        a.getTitle(),
                        a.getCategory(),
                        a.getDescription(),
                        a.getIcon(),
                        a.getIconBgColor(),
                        a.getLevelBadge()
                );
            }).collect(Collectors.toList()));
        }

        // Lessons created by user
        List<Lesson> lessons = lessonRepository.findByTeacherId(userId);
        dto.setLessonsCreated(lessons.stream().map(l -> new PublicProfileDto.PublicLessonItem(
                l.getId(),
                l.getTitle(),
                l.getCategory(),
                l.getDescription(),
                l.getSkillLevel() != null ? l.getSkillLevel().name() : "Intermediate",
                l.getDurationMinutes()
        )).collect(Collectors.toList()));

        // Activity summary (strictly non-sensitive metrics only)
        dto.setActivitySummary(new PublicProfileDto.PublicActivitySummary(
                profile.getHoursTaught(),
                showLearningHistory ? profile.getHoursLearned() : null,
                profile.getReviewCount(),
                profile.getPeerReputation(),
                profile.getSwapFulfillRate(),
                profile.getMemberSince()
        ));

        return dto;
    }

    @Transactional(readOnly = true)
    public List<TeachingSkillDto> getTeachingSkills(String userId) {
        List<UserSkill> list = userSkillRepository.findByUserIdAndSkillType(userId, SkillType.TEACH);
        return list.stream().map(s -> {
            TeachingSkillDto d = new TeachingSkillDto();
            d.setId(s.getId());
            d.setName(s.getName());
            d.setCategory(s.getCategory());
            d.setLevel(s.getSkillLevel() != null ? s.getSkillLevel().name() : "Intermediate");
            d.setProficiencyPercent(s.getProficiencyPercent());
            d.setHoursTaught(s.getHoursTaught());
            d.setEndorsementsCount(s.getEndorsementsCount());
            d.setReviewsCount(s.getReviewsCount());
            return d;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LearningSkillDto> getLearningSkills(String userId) {
        List<UserSkill> list = userSkillRepository.findByUserIdAndSkillType(userId, SkillType.LEARN);
        return list.stream().map(s -> {
            LearningSkillDto d = new LearningSkillDto();
            d.setId(s.getId());
            d.setName(s.getName());
            d.setCategory(s.getCategory());
            d.setCurrentLevel(s.getSkillLevel() != null ? s.getSkillLevel().name() : "Beginner");
            d.setTargetLevel(s.getTargetLevel() != null ? s.getTargetLevel().name() : "Advanced");
            d.setProgressPercent(s.getProficiencyPercent());
            d.setHoursPracticed(s.getHoursPracticed());
            d.setPartnerName(s.getPartnerName());
            d.setTargetDate(s.getTargetDate());
            return d;
        }).collect(Collectors.toList());
    }

    @Transactional
    public UserSkill addUserSkill(String userId, AddSkillRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        userSkillRepository.findByUserIdAndNameIgnoreCaseAndSkillType(userId, request.getName().trim(), request.getSkillType())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Skill '" + request.getName() + "' is already in your " + request.getSkillType() + " list");
                });

        UserSkill skill = new UserSkill();
        skill.setUser(user);
        skill.setName(request.getName().trim());
        skill.setCategory(request.getCategory() != null ? request.getCategory() : "General");
        skill.setSkillType(request.getSkillType());
        skill.setSkillLevel(request.getSkillLevel());
        skill.setTargetLevel(request.getTargetLevel());
        skill.setProficiencyPercent(request.getProficiencyPercent() != null ? request.getProficiencyPercent() : 50);
        skill.setDescription(request.getDescription());
        skill.setTargetDate(request.getTargetDate());

        skillRepository.findByNameIgnoreCase(request.getName().trim())
                .ifPresent(skill::setSkill);

        return userSkillRepository.save(skill);
    }

    @Transactional
    public void removeUserSkill(String userId, String skillId) {
        userSkillRepository.deleteByUserIdAndId(userId, skillId);
    }

    @Transactional
    public UserSkill updateUserSkillLevel(String userId, String skillId, UpdateSkillLevelRequest request) {
        UserSkill skill = userSkillRepository.findByUserIdAndId(userId, skillId)
                .orElseThrow(() -> new ResourceNotFoundException("UserSkill", "id", skillId));

        if (request.getSkillLevel() != null) {
            skill.setSkillLevel(request.getSkillLevel());
        }
        if (request.getTargetLevel() != null) {
            skill.setTargetLevel(request.getTargetLevel());
        }
        if (request.getProficiencyPercent() != null) {
            skill.setProficiencyPercent(request.getProficiencyPercent());
        }
        if (request.getDescription() != null) {
            skill.setDescription(request.getDescription());
        }

        return userSkillRepository.save(skill);
    }

    @Transactional(readOnly = true)
    public List<AchievementDto> getUserAchievements(String userId) {
        List<UserAchievement> userAchievements = userAchievementRepository.findByUserId(userId);
        return userAchievements.stream().map(ua -> {
            Achievement a = ua.getAchievement();
            AchievementDto d = new AchievementDto();
            d.setId(a.getId());
            d.setTitle(a.getTitle());
            d.setCategory(a.getCategory());
            d.setDescription(a.getDescription());
            d.setIcon(a.getIcon());
            d.setIconBgColor(a.getIconBgColor());
            d.setProgressText(a.getProgressText());
            d.setFillPercent(a.getFillPercent());
            d.setLevelBadge(a.getLevelBadge());
            d.setEndorsementsCount(ua.getEndorsementsCount());
            d.setIssuedDate(ua.getIssuedDate());
            d.setEarnedAt(ua.getCreatedAt());
            return d;
        }).collect(Collectors.toList());
    }
}
