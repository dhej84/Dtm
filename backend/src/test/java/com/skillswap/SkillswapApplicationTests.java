package com.skillswap;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SkillswapApplicationTests {

    @Test
    void contextLoads() {
        // Confirms Spring Boot application context loads cleanly with all beans, repositories, and configurations
    }
}
