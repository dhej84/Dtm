package com.skillswap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.dto.request.SignupRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RecommendationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String tokenLearner;
    private static String learnerId;
    private static String tokenMentor;
    private static String mentorId;

    @Test
    @Order(1)
    @DisplayName("1. Setup users with skills for recommendation testing")
    void setupRecommendationUsers() throws Exception {
        // Create Learner wanting Data Structures & Algorithms
        SignupRequest r1 = new SignupRequest();
        r1.setName("Alice Learner");
        r1.setEmail("alice.rec@berkeley.edu");
        r1.setPassword("Pass123456!");
        r1.setUniversity("UC Berkeley");
        r1.setDepartment("Computer Science");
        r1.setYear("Junior");

        MvcResult res1 = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(r1)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json1 = objectMapper.readTree(res1.getResponse().getContentAsString());
        tokenLearner = json1.path("data").path("token").asText();
        learnerId = json1.path("data").path("user").path("id").asText();

        // Create Mentor teaching Data Structures & Algorithms
        SignupRequest r2 = new SignupRequest();
        r2.setName("Bob Mentor");
        r2.setEmail("bob.rec@berkeley.edu");
        r2.setPassword("Pass123456!");
        r2.setUniversity("UC Berkeley");
        r2.setDepartment("Computer Science");
        r2.setYear("Senior");

        MvcResult res2 = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(r2)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json2 = objectMapper.readTree(res2.getResponse().getContentAsString());
        tokenMentor = json2.path("data").path("token").asText();
        mentorId = json2.path("data").path("user").path("id").asText();
    }

    @Test
    @Order(2)
    @DisplayName("2. GET /recommendations/mentors returns explainable recommendations")
    void testGetRecommendedMentors() throws Exception {
        mockMvc.perform(get("/recommendations/mentors")
                .header("Authorization", "Bearer " + tokenLearner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(3)
    @DisplayName("3. GET /recommendations/learners returns learners for mentor")
    void testGetRecommendedLearners() throws Exception {
        mockMvc.perform(get("/recommendations/learners")
                .header("Authorization", "Bearer " + tokenMentor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(4)
    @DisplayName("4. GET /recommendations/lessons returns lessons excluding completed")
    void testGetRecommendedLessons() throws Exception {
        mockMvc.perform(get("/recommendations/lessons")
                .header("Authorization", "Bearer " + tokenLearner)
                .param("includeCompleted", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(5)
    @DisplayName("5. GET /recommendations/skill-gaps detects learning areas")
    void testGetSkillGaps() throws Exception {
        mockMvc.perform(get("/recommendations/skill-gaps")
                .header("Authorization", "Bearer " + tokenLearner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(6)
    @DisplayName("6. GET /recommendations/explanation/{candidateId} returns factor breakdown")
    void testGetMatchExplanation() throws Exception {
        mockMvc.perform(get("/recommendations/explanation/" + mentorId)
                .header("Authorization", "Bearer " + tokenLearner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.overallScore").isNumber())
                .andExpect(jsonPath("$.data.factorBreakdown").isArray())
                .andExpect(jsonPath("$.data.summary").isString());
    }

    @Test
    @Order(7)
    @DisplayName("7. Unauthorized access is rejected with 401 Unauthorized")
    void testUnauthorizedRecommendations() throws Exception {
        mockMvc.perform(get("/recommendations/mentors"))
                .andExpect(status().isUnauthorized());
    }
}
