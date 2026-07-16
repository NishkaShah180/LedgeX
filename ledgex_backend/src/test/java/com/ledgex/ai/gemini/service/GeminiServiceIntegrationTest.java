package com.ledgex.ai.gemini.service;

import com.ledgex.ai.gemini.dto.ChatRequestDTO;
import com.ledgex.ai.gemini.dto.ChatResponseDTO;
import com.ledgex.auth.dto.RegisterRequest;
import com.ledgex.auth.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Transactional
public class GeminiServiceIntegrationTest {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private UserService userService;

    @Test
    public void testChatWithCoach() {
        // Given a registered user
        String email = "test_ai_chat_" + System.currentTimeMillis() + "@test.com";
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Test")
                .lastName("AIUser")
                .email(email)
                .password("password123")
                .build();
        
        userService.register(registerRequest);

        // When
        ChatRequestDTO request = ChatRequestDTO.builder()
                .prompt("Hello, I am testing the AI feature. Give me a brief 1 sentence hello.")
                .month(7)
                .year(2026)
                .build();
        
        System.out.println("--------------------------------------------------");
        System.out.println("Sending request to Gemini AI...");
        ChatResponseDTO response = geminiService.chatWithCoach(email, request);

        // Then
        System.out.println("AI Response received:");
        System.out.println(response.getResponse());
        System.out.println("--------------------------------------------------");
        
        assertNotNull(response.getResponse());
    }
}
