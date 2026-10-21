package com.skillswap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.dto.request.*;
import com.skillswap.enums.LessonFormat;
import com.skillswap.enums.SkillLevel;
import com.skillswap.enums.SkillType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SkillSwapApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Static variables to share state across sequential tests
    private static String tokenUserA;
    private static String userAId;
    private static String tokenUserB;
    private static String userBId;
    private static String createdSkillId;
    private static String userASkillId;
    private static String createdLessonId;
    private static String createdCommentId;
    private static String createdConnectionId;

    // ==========================================
    // 1. AUTHENTICATION TESTS
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("1.1 Auth: Signup User A successfully (201 Created)")
    void testSignupUserA() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setName("Charlie Brown");
        request.setEmail("charlie@berkeley.edu");
        request.setPassword("securePassword123");
        request.setUniversity("UC Berkeley");
        request.setDepartment("EECS");
        request.setYear("Sophomore");

        MvcResult result = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("charlie@berkeley.edu"))
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        tokenUserA = root.path("data").path("token").asText();
        userAId = root.path("data").path("user").path("id").asText();
        assertThat(tokenUserA).isNotEmpty();
    }

    @Test
    @Order(2)
    @DisplayName("1.2 Auth: Signup User B successfully (201 Created)")
    void testSignupUserB() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setName("Dana Scully");
        request.setEmail("dana@oxford.ac.uk");
        request.setPassword("scullyPass789");
        request.setUniversity("Oxford University");
        request.setDepartment("Biochemistry");
        request.setYear("Graduate");

        MvcResult result = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("dana@oxford.ac.uk"))
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        tokenUserB = root.path("data").path("token").asText();
        userBId = root.path("data").path("user").path("id").asText();
        assertThat(tokenUserB).isNotEmpty();
    }

    @Test
    @Order(3)
    @DisplayName("1.3 Auth Error: Duplicate signup email returns 409 Conflict")
    void testSignupDuplicateEmail() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setName("Charlie Impostor");
        request.setEmail("charlie@berkeley.edu");
        request.setPassword("anotherPassword");

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @Order(4)
    @DisplayName("1.4 Auth Error: Invalid email format and weak password returns 400 Bad Request")
    void testSignupValidationFailure() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setName("Bad");
        request.setEmail("invalid-email-string");
        request.setPassword("123"); // less than 6 chars

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors").isMap());
    }

    @Test
    @Order(5)
    @DisplayName("1.5 Auth: Login with valid credentials returns JWT (200 OK)")
    void testLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("charlie@berkeley.edu", "securePassword123");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("charlie@berkeley.edu"))
                .andExpect(jsonPath("$.data.user.password").doesNotExist());
    }

    @Test
    @Order(6)
    @DisplayName("1.6 Auth Error: Login with invalid password returns 401 Unauthorized")
    void testLoginInvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest("charlie@berkeley.edu", "wrongPassword!");

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @Order(7)
    @DisplayName("1.7 Auth: Get current authenticated user /auth/me returns 200 OK")
    void testGetAuthMeAuthenticated() throws Exception {
        mockMvc.perform(get("/auth/me")
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(userAId))
                .andExpect(jsonPath("$.data.email").value("charlie@berkeley.edu"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @Order(8)
    @DisplayName("1.8 Auth: /auth/me without token returns 401 Unauthorized")
    void testGetAuthMeUnauthenticated() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // ==========================================
    // 2. USER & PROFILE MANAGEMENT TESTS
    // ==========================================

    @Test
    @Order(10)
    @DisplayName("2.1 Profile: Get current user profile (200 OK)")
    void testGetCurrentProfile() throws Exception {
        mockMvc.perform(get("/profile")
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.id").value(userAId))
                .andExpect(jsonPath("$.data.profileVisibility").value("PUBLIC"))
                .andExpect(jsonPath("$.data.user.password").doesNotExist());
    }

    @Test
    @Order(11)
    @DisplayName("2.2 Profile: Update profile bio, location, and visibility (200 OK)")
    void testUpdateProfile() throws Exception {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setBio("Machine learning enthusiast and guitar tutor.");
        request.setLocation("Berkeley, CA");
        request.setProfileVisibility("CAMPUS_ONLY");
        request.setAllowDirectSwaps(true);

        mockMvc.perform(put("/profile")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.bio").value("Machine learning enthusiast and guitar tutor."))
                .andExpect(jsonPath("$.data.location").value("Berkeley, CA"))
                .andExpect(jsonPath("$.data.profileVisibility").value("CAMPUS_ONLY"));
    }

    @Test
    @Order(12)
    @DisplayName("2.3 User: Find user by ID (200 OK)")
    void testGetUserById() throws Exception {
        mockMvc.perform(get("/users/" + userAId)
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Charlie Brown"))
                .andExpect(jsonPath("$.data.university").value("UC Berkeley"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @Order(13)
    @DisplayName("2.4 User Error: Non-existent user ID returns 404 Not Found")
    void testGetUserByIdNotFound() throws Exception {
        mockMvc.perform(get("/users/non-existent-user-id-999")
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    // ==========================================
    // 3. SKILL MANAGEMENT & LEVELS TESTS
    // ==========================================

    @Test
    @Order(20)
    @DisplayName("3.1 Skill: Create new catalog skill (201 Created)")
    void testCreateCatalogSkill() throws Exception {
        com.skillswap.dto.response.SkillDto skillDto = new com.skillswap.dto.response.SkillDto();
        skillDto.setName("Quantum Algorithms");
        skillDto.setCategory("Physics & Computing");
        skillDto.setDescription("Shor's and Grover's algorithms on Qiskit");
        skillDto.setPopularLevel("Advanced");

        MvcResult result = mockMvc.perform(post("/skills")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(skillDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Quantum Algorithms"))
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        createdSkillId = root.path("data").path("id").asText();
    }

    @Test
    @Order(21)
    @DisplayName("3.2 Skill: Browse catalog skills (200 OK)")
    void testGetCatalogSkills() throws Exception {
        mockMvc.perform(get("/skills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isNotEmpty());
    }

    @Test
    @Order(22)
    @DisplayName("3.3 Skill: Add teaching skill to User A profile (201 Created)")
    void testAddTeachingSkill() throws Exception {
        AddSkillRequest request = new AddSkillRequest();
        request.setName("Quantum Algorithms");
        request.setCategory("Physics & Computing");
        request.setSkillType(SkillType.TEACH);
        request.setSkillLevel(SkillLevel.ADVANCED);
        request.setProficiencyPercent(90);

        MvcResult result = mockMvc.perform(post("/profile/skills")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Quantum Algorithms"))
                .andExpect(jsonPath("$.data.skillLevel").value("ADVANCED"))
                .andExpect(jsonPath("$.data.skillType").value("TEACH"))
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        userASkillId = root.path("data").path("id").asText();
    }

    @Test
    @Order(23)
    @DisplayName("3.4 Skill: Add learning skill with Beginner level to User A profile (201 Created)")
    void testAddLearningSkill() throws Exception {
        AddSkillRequest request = new AddSkillRequest();
        request.setName("Spanish Conversation");
        request.setCategory("Languages");
        request.setSkillType(SkillType.LEARN);
        request.setSkillLevel(SkillLevel.BEGINNER);
        request.setTargetLevel(SkillLevel.INTERMEDIATE);
        request.setProficiencyPercent(25);

        mockMvc.perform(post("/profile/skills")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Spanish Conversation"))
                .andExpect(jsonPath("$.data.skillLevel").value("BEGINNER"))
                .andExpect(jsonPath("$.data.skillType").value("LEARN"));
    }

    @Test
    @Order(24)
    @DisplayName("3.5 Skill Error: Adding duplicate skill for same user and type returns 409 Conflict")
    void testAddDuplicateSkill() throws Exception {
        AddSkillRequest request = new AddSkillRequest();
        request.setName("Quantum Algorithms");
        request.setSkillType(SkillType.TEACH);
        request.setSkillLevel(SkillLevel.INTERMEDIATE);

        mockMvc.perform(post("/profile/skills")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @Order(25)
    @DisplayName("3.6 Skill: Update user skill level to Intermediate (200 OK)")
    void testUpdateSkillLevel() throws Exception {
        UpdateSkillLevelRequest updateReq = new UpdateSkillLevelRequest();
        updateReq.setSkillLevel(SkillLevel.INTERMEDIATE);
        updateReq.setProficiencyPercent(75);
        updateReq.setDescription("Updated experience with Qiskit simulations");

        mockMvc.perform(put("/profile/skills/" + userASkillId)
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillLevel").value("INTERMEDIATE"))
                .andExpect(jsonPath("$.data.proficiencyPercent").value(75));
    }

    @Test
    @Order(26)
    @DisplayName("3.7 Skill: Remove skill from user profile (200 OK)")
    void testRemoveSkill() throws Exception {
        // Add a temporary skill to delete
        AddSkillRequest temp = new AddSkillRequest();
        temp.setName("Temporary Origami");
        temp.setSkillType(SkillType.TEACH);
        temp.setSkillLevel(SkillLevel.BEGINNER);

        MvcResult tempResult = mockMvc.perform(post("/profile/skills")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(temp)))
                .andExpect(status().isCreated())
                .returnResult();

        String tempSkillId = objectMapper.readTree(tempResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(delete("/profile/skills/" + tempSkillId)
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==========================================
    // 4. LESSON MANAGEMENT TESTS
    // ==========================================

    @Test
    @Order(30)
    @DisplayName("4.1 Lesson: Create lesson with modules (201 Created)")
    void testCreateLesson() throws Exception {
        CreateLessonRequest request = new CreateLessonRequest();
        request.setTitle("Quantum Teleportation Lab");
        request.setSkill("Quantum Algorithms");
        request.setCategory("Physics");
        request.setDescription("Step-by-step hands-on implementation of Bell states and EPR pairs.");
        request.setSkillLevel(SkillLevel.ADVANCED);
        request.setFormat(LessonFormat.HANDS_ON_PROJECT);
        request.setDurationMinutes(75);
        request.setCreditsRequired(new BigDecimal("1.50"));
        request.setPrerequisites("Linear Algebra, Complex numbers");

        CreateLessonRequest.ModuleDto mod1 = new CreateLessonRequest.ModuleDto();
        mod1.setTitle("1. Bell State Creation");
        mod1.setDuration("20 min");
        mod1.setSequenceOrder(1);

        CreateLessonRequest.ModuleDto mod2 = new CreateLessonRequest.ModuleDto();
        mod2.setTitle("2. Entanglement Verification");
        mod2.setDuration("55 min");
        mod2.setSequenceOrder(2);

        request.setModules(List.of(mod1, mod2));

        MvcResult result = mockMvc.perform(post("/lessons")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Quantum Teleportation Lab"))
                .andExpect(jsonPath("$.data.teacher.id").value(userAId))
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        createdLessonId = root.path("data").path("id").asText();
        assertThat(createdLessonId).isNotEmpty();
    }

    @Test
    @Order(31)
    @DisplayName("4.2 Lesson: Get lesson detail by ID (200 OK)")
    void testGetLessonDetail() throws Exception {
        mockMvc.perform(get("/lessons/" + createdLessonId)
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(createdLessonId))
                .andExpect(jsonPath("$.data.modules").isArray())
                .andExpect(jsonPath("$.data.modules.length()").value(2));
    }

    @Test
    @Order(32)
    @DisplayName("4.3 Lesson: Filter lessons by skill and level (200 OK)")
    void testFilterLessonsBySkillAndLevel() throws Exception {
        mockMvc.perform(get("/lessons")
                .param("skill", "Quantum Algorithms")
                .param("skillLevel", "ADVANCED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(33)
    @DisplayName("4.4 Lesson: Update lesson by teacher (200 OK)")
    void testUpdateLessonByTeacher() throws Exception {
        UpdateLessonRequest updateReq = new UpdateLessonRequest();
        updateReq.setTitle("Quantum Teleportation & QKD Workshop");
        updateReq.setDurationMinutes(90);

        mockMvc.perform(put("/lessons/" + createdLessonId)
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Quantum Teleportation & QKD Workshop"))
                .andExpect(jsonPath("$.data.durationMinutes").value(90));
    }

    @Test
    @Order(34)
    @DisplayName("4.5 Lesson Error: Update lesson by non-teacher returns 403 Forbidden")
    void testUpdateLessonForbidden() throws Exception {
        UpdateLessonRequest updateReq = new UpdateLessonRequest();
        updateReq.setTitle("Malicious Title Override");

        mockMvc.perform(put("/lessons/" + createdLessonId)
                .header("Authorization", "Bearer " + tokenUserB)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // ==========================================
    // 5. PROGRESS TRACKING TESTS
    // ==========================================

    @Test
    @Order(40)
    @DisplayName("5.1 Progress: Enroll User B in lesson (200 OK)")
    void testEnrollInLesson() throws Exception {
        mockMvc.perform(post("/lessons/" + createdLessonId + "/enroll")
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.studentId").value(userBId))
                .andExpect(jsonPath("$.data.lessonId").value(createdLessonId))
                .andExpect(jsonPath("$.data.progressPercent").value(0))
                .andExpect(jsonPath("$.data.isCompleted").value(false))
                .andExpect(jsonPath("$.data.startedAt").isNotEmpty());
    }

    @Test
    @Order(41)
    @DisplayName("5.2 Progress: Get User B progress for lesson (200 OK)")
    void testGetProgress() throws Exception {
        mockMvc.perform(get("/lessons/" + createdLessonId + "/progress")
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.lessonId").value(createdLessonId))
                .andExpect(jsonPath("$.data.progressPercent").value(0));
    }

    @Test
    @Order(42)
    @DisplayName("5.3 Progress: Update progress to 100% and mark completed (200 OK)")
    void testUpdateProgressAndComplete() throws Exception {
        UpdateProgressRequest updateReq = new UpdateProgressRequest();
        updateReq.setProgressPercent(100);
        updateReq.setIsCompleted(true);
        updateReq.setUserNotes("Understood the Hadamard transformation and entangled states!");
        updateReq.setCurrentStepIndex(2);

        mockMvc.perform(put("/lessons/" + createdLessonId + "/progress")
                .header("Authorization", "Bearer " + tokenUserB)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.progressPercent").value(100))
                .andExpect(jsonPath("$.data.isCompleted").value(true))
                .andExpect(jsonPath("$.data.completionStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.data.completedAt").isNotEmpty());
    }

    @Test
    @Order(43)
    @DisplayName("5.4 Progress: Get learning history for user (200 OK)")
    void testGetAllUserProgress() throws Exception {
        mockMvc.perform(get("/lessons/user/progress")
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].lessonTitle").isNotEmpty());
    }

    // ==========================================
    // 6. COMMENTS & PEER FEEDBACK TESTS
    // ==========================================

    @Test
    @Order(50)
    @DisplayName("6.1 Comments: Add comment to lesson by User B (201 Created)")
    void testAddComment() throws Exception {
        AddCommentRequest request = new AddCommentRequest("Fabulous workshop! The visual state sphere explained everything.");

        MvcResult result = mockMvc.perform(post("/lessons/" + createdLessonId + "/comments")
                .header("Authorization", "Bearer " + tokenUserB)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.text").value("Fabulous workshop! The visual state sphere explained everything."))
                .andExpect(jsonPath("$.data.author.id").value(userBId))
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        createdCommentId = root.path("data").path("id").asText();
        assertThat(createdCommentId).isNotEmpty();
    }

    @Test
    @Order(51)
    @DisplayName("6.2 Comments: Get comments thread for lesson (200 OK)")
    void testGetComments() throws Exception {
        mockMvc.perform(get("/lessons/" + createdLessonId + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(52)
    @DisplayName("6.3 Comments Error: User A cannot delete User B's comment returns 403 Forbidden")
    void testDeleteCommentUnauthorized() throws Exception {
        mockMvc.perform(delete("/comments/" + createdCommentId)
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @Order(53)
    @DisplayName("6.4 Comments: User B can delete own comment (200 OK)")
    void testDeleteOwnComment() throws Exception {
        mockMvc.perform(delete("/comments/" + createdCommentId)
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==========================================
    // 7. CONNECTIONS & SWAP REQUESTS TESTS
    // ==========================================

    @Test
    @Order(60)
    @DisplayName("7.1 Connection Error: Cannot send swap request to oneself returns 400 Bad Request")
    void testSendConnectionToSelf() throws Exception {
        ConnectionRequestDto request = new ConnectionRequestDto();
        request.setToUserId(userAId); // sending to self
        request.setTeachSkill("Quantum Computing");
        request.setLearnSkill("Organic Chemistry");

        mockMvc.perform(post("/connections")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @Order(61)
    @DisplayName("7.2 Connection: Send swap request from User A to User B (201 Created)")
    void testSendConnectionRequest() throws Exception {
        ConnectionRequestDto request = new ConnectionRequestDto();
        request.setToUserId(userBId);
        request.setTeachSkill("Quantum Computing");
        request.setLearnSkill("Biochemistry");
        request.setMessage("Hi Dana, would love to exchange skills!");

        MvcResult result = mockMvc.perform(post("/connections")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fromUser.id").value(userAId))
                .andExpect(jsonPath("$.data.toUser.id").value(userBId))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .returnResult();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        createdConnectionId = root.path("data").path("id").asText();
    }

    @Test
    @Order(62)
    @DisplayName("7.3 Connection Error: Duplicate connection request returns 409 Conflict")
    void testDuplicateConnectionRequest() throws Exception {
        ConnectionRequestDto request = new ConnectionRequestDto();
        request.setToUserId(userBId);
        request.setTeachSkill("Quantum Computing");

        mockMvc.perform(post("/connections")
                .header("Authorization", "Bearer " + tokenUserA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @Order(63)
    @DisplayName("7.4 Connection: View pending received swap requests by User B (200 OK)")
    void testGetPendingRequests() throws Exception {
        mockMvc.perform(get("/connections/pending")
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    @Order(64)
    @DisplayName("7.5 Connection: Accept incoming request by User B (200 OK)")
    void testAcceptConnectionRequest() throws Exception {
        mockMvc.perform(patch("/connections/" + createdConnectionId + "/accept")
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    @Order(65)
    @DisplayName("7.6 Connection: View accepted connections (200 OK)")
    void testGetUserConnections() throws Exception {
        mockMvc.perform(get("/connections")
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    // ==========================================
    // 8. SEARCH & COMBINED FILTER TESTS
    // ==========================================

    @Test
    @Order(70)
    @DisplayName("8.1 Search: Search students by university or name (200 OK)")
    void testSearchStudents() throws Exception {
        mockMvc.perform(get("/users")
                .param("query", "Berkeley")
                .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].name").value("Charlie Brown"));
    }

    @Test
    @Order(71)
    @DisplayName("8.2 Search: Combined filter lessons by query, skill, and level (200 OK)")
    void testCombinedSearchLessons() throws Exception {
        mockMvc.perform(get("/lessons")
                .param("query", "Teleportation")
                .param("skill", "Quantum Algorithms")
                .param("skillLevel", "ADVANCED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    // ==========================================
    // 9. FILE UPLOAD & STORAGE TESTS
    // ==========================================

    @Test
    @Order(80)
    @DisplayName("9.1 File: Upload syllabus document (201 Created)")
    void testFileUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "quantum_lab_syllabus.pdf",
                "application/pdf",
                "Dummy PDF content simulating lesson materials".getBytes()
        );

        mockMvc.perform(multipart("/files/upload")
                .file(file)
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fileName").isNotEmpty())
                .andExpect(jsonPath("$.data.fileDownloadUri").isNotEmpty());
    }

    @Test
    @Order(81)
    @DisplayName("9.2 File Error: Reject empty file upload returns 400 Bad Request")
    void testEmptyFileUpload() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        mockMvc.perform(multipart("/files/upload")
                .file(emptyFile)
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    // ==========================================
    // 10. CLEANUP & DELETE LESSON TEST
    // ==========================================

    @Test
    @Order(90)
    @DisplayName("10.1 Lesson: Delete lesson by teacher (200 OK)")
    void testDeleteLesson() throws Exception {
        mockMvc.perform(delete("/lessons/" + createdLessonId)
                .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Subsequent get should return 404
        mockMvc.perform(get("/lessons/" + createdLessonId))
                .andExpect(status().isNotFound());
    }
}
