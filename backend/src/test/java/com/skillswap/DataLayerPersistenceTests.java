package com.skillswap;

import com.skillswap.entity.*;
import com.skillswap.enums.ConnectionStatus;
import com.skillswap.enums.LessonFormat;
import com.skillswap.enums.SkillLevel;
import com.skillswap.enums.SkillType;
import com.skillswap.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
public class DataLayerPersistenceTests {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonProgressRepository lessonProgressRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    private User testStudent1;
    private User testStudent2;

    @BeforeEach
    void setUp() {
        testStudent1 = new User("Alice Walker", "alice@stanford.edu", "$2a$10$encodedpasswordhash", "Stanford University", "CS", "Senior");
        testStudent2 = new User("Bob Harris", "bob@mit.edu", "$2a$10$encodedpasswordhash", "MIT", "EECS", "Junior");

        entityManager.persist(testStudent1);
        entityManager.persist(testStudent2);
        entityManager.flush();
    }

    @Test
    @DisplayName("Verify User and Profile persistence and cascade")
    void testUserAndProfilePersistence() {
        Profile profile = new Profile(testStudent1);
        profile.setBio("Passionate systems programmer and tutor.");
        profile.setLocation("Palo Alto, CA");
        profile.setProfileVisibility("PUBLIC");
        profileRepository.save(profile);

        Optional<Profile> found = profileRepository.findById(testStudent1.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getBio()).isEqualTo("Passionate systems programmer and tutor.");
        assertThat(found.get().getUser().getEmail()).isEqualTo("alice@stanford.edu");
        assertThat(found.get().getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Verify Skill catalog persistence and search")
    void testSkillPersistenceAndSearch() {
        Skill skill = new Skill();
        skill.setName("Distributed Computing");
        skill.setCategory("Computer Science");
        skill.setDescription("Consensus protocols, Raft, Paxos.");
        skill.setPopularLevel("Advanced");
        skillRepository.save(skill);

        Optional<Skill> found = skillRepository.findByNameIgnoreCase("distributed computing");
        assertThat(found).isPresent();
        assertThat(found.get().getCategory()).isEqualTo("Computer Science");
    }

    @Test
    @DisplayName("Verify UserSkill relationship and prevent duplicate entry")
    void testUserSkillPersistenceAndUniqueness() {
        UserSkill teachingSkill = new UserSkill(testStudent1, "Distributed Systems", "Computer Science", SkillType.TEACH, SkillLevel.ADVANCED);
        teachingSkill.setProficiencyPercent(95);
        userSkillRepository.save(teachingSkill);

        Optional<UserSkill> found = userSkillRepository.findByUserIdAndNameIgnoreCaseAndSkillType(
                testStudent1.getId(), "Distributed Systems", SkillType.TEACH);
        assertThat(found).isPresent();
        assertThat(found.get().getSkillLevel()).isEqualTo(SkillLevel.ADVANCED);

        // Duplicate insertion with same (user_id, name, skill_type) should violate unique constraint
        UserSkill duplicateSkill = new UserSkill(testStudent1, "Distributed Systems", "Computer Science", SkillType.TEACH, SkillLevel.INTERMEDIATE);
        assertThrows(DataIntegrityViolationException.class, () -> {
            userSkillRepository.saveAndFlush(duplicateSkill);
        });
    }

    @Test
    @DisplayName("Verify Lesson creation with modules and teacher relationship")
    void testLessonPersistence() {
        Lesson lesson = new Lesson();
        lesson.setTitle("Raft Consensus from First Principles");
        lesson.setSkill("Distributed Systems");
        lesson.setCategory("Computer Science");
        lesson.setDescription("Build a leader election state machine.");
        lesson.setSkillLevel(SkillLevel.ADVANCED);
        lesson.setFormat(LessonFormat.INTERACTIVE_WORKSHOP);
        lesson.setTeacher(testStudent1);
        lesson.setDurationMinutes(90);
        lesson.setCreditsRequired(new BigDecimal("2.00"));

        LessonModule mod1 = new LessonModule();
        mod1.setTitle("Term numbers & timers");
        mod1.setSequenceOrder(1);
        lesson.addModule(mod1);

        Lesson saved = lessonRepository.save(lesson);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getModules()).hasSize(1);
        assertThat(saved.getTeacher().getName()).isEqualTo("Alice Walker");
    }

    @Test
    @DisplayName("Verify LessonProgress persistence, startedAt, and uniqueness constraint")
    void testLessonProgressPersistenceAndConstraint() {
        Lesson lesson = new Lesson();
        lesson.setTitle("PyTorch Basics");
        lesson.setSkill("Machine Learning");
        lesson.setCategory("CS");
        lesson.setSkillLevel(SkillLevel.BEGINNER);
        lesson.setTeacher(testStudent1);
        entityManager.persist(lesson);
        entityManager.flush();

        LessonProgress progress = new LessonProgress(lesson, testStudent2);
        progress.setProgressPercent(50);
        progress.setCompletionStatus("IN_PROGRESS");
        lessonProgressRepository.save(progress);

        Optional<LessonProgress> found = lessonProgressRepository.findByLessonIdAndUserId(lesson.getId(), testStudent2.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getProgressPercent()).isEqualTo(50);
        assertThat(found.get().getStartedAt()).isNotNull();

        // Duplicate progress record for same student and lesson should fail
        LessonProgress duplicate = new LessonProgress(lesson, testStudent2);
        assertThrows(DataIntegrityViolationException.class, () -> {
            lessonProgressRepository.saveAndFlush(duplicate);
        });
    }

    @Test
    @DisplayName("Verify Comments and Comment likes persistence")
    void testCommentPersistence() {
        Lesson lesson = new Lesson();
        lesson.setTitle("Design Systems");
        lesson.setSkill("UX Design");
        lesson.setCategory("Design");
        lesson.setSkillLevel(SkillLevel.INTERMEDIATE);
        lesson.setTeacher(testStudent1);
        entityManager.persist(lesson);
        entityManager.flush();

        Comment comment = new Comment(lesson, testStudent2, "Super informative session!");
        Comment savedComment = commentRepository.save(comment);

        assertThat(savedComment.getId()).isNotNull();
        assertThat(savedComment.getCreatedAt()).isNotNull();
        assertThat(savedComment.getText()).isEqualTo("Super informative session!");
    }

    @Test
    @DisplayName("Verify Connection request creation and uniqueness")
    void testConnectionPersistenceAndUniqueness() {
        Connection conn = new Connection(testStudent1, testStudent2, "Rust", "Python", "Hi Bob, lets swap!");
        connectionRepository.save(conn);

        Optional<Connection> found = connectionRepository.findBetweenUsers(testStudent1.getId(), testStudent2.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getStatus()).isEqualTo(ConnectionStatus.PENDING);

        // Attempting duplicate connection from the same sender to same recipient should violate uniqueness
        Connection duplicate = new Connection(testStudent1, testStudent2, "Rust", "Python", "Another request");
        assertThrows(DataIntegrityViolationException.class, () -> {
            connectionRepository.saveAndFlush(duplicate);
        });
    }

    @Test
    @DisplayName("Verify Achievement and UserAchievement linking")
    void testAchievementPersistence() {
        Achievement achievement = new Achievement("Top Peer Mentor", "Teaching", "Validated by 10+ students", "star", "bg-emerald-100", "10/10", 100, "Master");
        achievementRepository.save(achievement);

        UserAchievement userAchievement = new UserAchievement(testStudent1, achievement);
        userAchievement.setEndorsementsCount(12);
        userAchievementRepository.save(userAchievement);

        Optional<UserAchievement> found = userAchievementRepository.findByUserIdAndAchievementId(testStudent1.getId(), achievement.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getAchievement().getTitle()).isEqualTo("Top Peer Mentor");
        assertThat(found.get().getEndorsementsCount()).isEqualTo(12);
    }
}
