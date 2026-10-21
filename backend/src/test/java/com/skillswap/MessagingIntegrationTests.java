package com.skillswap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.dto.request.ReportUserRequest;
import com.skillswap.dto.request.SendMessageRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MessagingIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String tokenLearner;
    private static String learnerId;
    private static String tokenMentor;
    private static String mentorId;
    private static String tokenOther;
    private static String otherUserId;
    private static String conversationId;

    @Test
    @Order(1)
    @DisplayName("1. Setup users for messaging tests")
    void setupUsers() throws Exception {
        // Create Learner
        SignupRequest r1 = new SignupRequest();
        r1.setName("Maya Learner");
        r1.setEmail("maya.chat@berkeley.edu");
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

        // Create Mentor
        SignupRequest r2 = new SignupRequest();
        r2.setName("Liam Mentor");
        r2.setEmail("liam.chat@berkeley.edu");
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

        // Create Third Unrelated User (for privacy tests)
        SignupRequest r3 = new SignupRequest();
        r3.setName("Third Party");
        r3.setEmail("third.party@berkeley.edu");
        r3.setPassword("Pass123456!");
        r3.setUniversity("UC Berkeley");
        r3.setDepartment("History");
        r3.setYear("Freshman");

        MvcResult res3 = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(r3)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json3 = objectMapper.readTree(res3.getResponse().getContentAsString());
        tokenOther = json3.path("data").path("token").asText();
        otherUserId = json3.path("data").path("user").path("id").asText();
    }

    @Test
    @Order(2)
    @DisplayName("2. Start or get conversation between Learner and Mentor")
    void testStartConversation() throws Exception {
        MvcResult res = mockMvc.perform(post("/conversations/start")
                .header("Authorization", "Bearer " + tokenLearner)
                .param("targetUserId", mentorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.partnerId").value(mentorId))
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        conversationId = json.path("data").path("id").asText();
        assertThat(conversationId).isNotEmpty();
    }

    @Test
    @Order(3)
    @DisplayName("3. Send Tanglish message from Learner to Mentor with intent detection")
    void testSendTanglishMessage() throws Exception {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(conversationId);
        request.setContent("bro recursion epdi work aaguthu? indha part purila");

        MvcResult res = mockMvc.perform(post("/messages")
                .header("Authorization", "Bearer " + tokenLearner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.detectedLanguage").value("Tanglish"))
                .andExpect(jsonPath("$.data.detectedIntent").value("concept_clarification"))
                .andExpect(jsonPath("$.data.content").value("bro recursion epdi work aaguthu? indha part purila"))
                .andExpect(jsonPath("$.data.status").value("DELIVERED"))
                .andReturn();
    }

    @Test
    @Order(4)
    @DisplayName("4. Mentor reads message and updates status to READ")
    void testMentorReadsMessages() throws Exception {
        MvcResult res = mockMvc.perform(get("/conversations/" + conversationId + "/messages")
                .header("Authorization", "Bearer " + tokenMentor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        JsonNode firstMsg = json.path("data").get(0);
        assertThat(firstMsg.path("status").asText()).isEqualTo("READ");
    }

    @Test
    @Order(5)
    @DisplayName("5. Mentor replies with explanation")
    void testMentorReplies() throws Exception {
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(conversationId);
        request.setContent("Recursion needs a base case and recursive step. Which one are you stuck on?");

        mockMvc.perform(post("/messages")
                .header("Authorization", "Bearer " + tokenMentor)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.senderName").value("Liam Mentor"));
    }

    @Test
    @Order(6)
    @DisplayName("6. Privacy check: Third party cannot access Learner-Mentor conversation (403 Forbidden)")
    void testPrivacyAccessDenied() throws Exception {
        mockMvc.perform(get("/conversations/" + conversationId + "/messages")
                .header("Authorization", "Bearer " + tokenOther))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(7)
    @DisplayName("7. Report user for moderation review")
    void testReportUser() throws Exception {
        ReportUserRequest report = new ReportUserRequest(
                mentorId,
                conversationId,
                null,
                "Inappropriate behavior",
                "Testing moderation report workflow"
        );

        mockMvc.perform(post("/messages/report")
                .header("Authorization", "Bearer " + tokenLearner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(report)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(8)
    @DisplayName("8. Block peer user and verify messaging is prohibited")
    void testBlockUser() throws Exception {
        // Learner blocks Mentor
        mockMvc.perform(post("/messages/block")
                .header("Authorization", "Bearer " + tokenLearner)
                .param("targetUserId", mentorId)
                .param("reason", "Testing block functionality"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Mentor tries to message Learner -> blocked (400 Bad Request)
        SendMessageRequest request = new SendMessageRequest();
        request.setConversationId(conversationId);
        request.setContent("Can you hear me?");

        mockMvc.perform(post("/messages")
                .header("Authorization", "Bearer " + tokenMentor)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
