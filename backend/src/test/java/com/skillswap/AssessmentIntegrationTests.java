package com.skillswap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillswap.dto.request.RecordIntegrityEventRequest;
import com.skillswap.dto.request.SignupRequest;
import com.skillswap.dto.request.SubmitAssessmentRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AssessmentIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String tokenStudent;
    private static String studentId;
    private static String tokenOther;
    private static String otherUserId;

    @Test
    @Order(1)
    @DisplayName("1. Setup student for assessment tests")
    void setupAssessmentStudent() throws Exception {
        SignupRequest r1 = new SignupRequest();
        r1.setName("Sam Student");
        r1.setEmail("sam.assess@berkeley.edu");
        r1.setPassword("Pass123456!");
        r1.setUniversity("UC Berkeley");
        r1.setDepartment("Computer Science");
        r1.setYear("Sophomore");

        MvcResult res1 = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(r1)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json1 = objectMapper.readTree(res1.getResponse().getContentAsString());
        tokenStudent = json1.path("data").path("token").asText();
        studentId = json1.path("data").path("user").path("id").asText();

        SignupRequest r2 = new SignupRequest();
        r2.setName("Other Student");
        r2.setEmail("other.assess@berkeley.edu");
        r2.setPassword("Pass123456!");
        r2.setUniversity("UC Berkeley");
        r2.setDepartment("Music");
        r2.setYear("Junior");

        MvcResult res2 = mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(r2)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json2 = objectMapper.readTree(res2.getResponse().getContentAsString());
        tokenOther = json2.path("data").path("token").asText();
        otherUserId = json2.path("data").path("user").path("id").asText();
    }

    @Test
    @Order(2)
    @DisplayName("2. Link Google Form assessment to a lesson module")
    void testLinkGoogleForm() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("lessonId", "lesson-1");
        request.put("moduleId", "mod-3");
        request.put("googleFormUrl", "https://forms.gle/mockAssessmentForm123");
        request.put("title", "Dijkstra Google Form Checkpoint");

        mockMvc.perform(post("/assessments/google-form")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isExternalGoogleForm").value(true))
                .andExpect(jsonPath("$.data.googleFormUrl").value("https://forms.gle/mockAssessmentForm123"));
    }

    @Test
    @Order(3)
    @DisplayName("3. GET /assessments/module/{moduleId} retrieves module assessment details")
    void testGetAssessment() throws Exception {
        mockMvc.perform(get("/assessments/module/mod-3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.moduleId").value("mod-3"));
    }
}
