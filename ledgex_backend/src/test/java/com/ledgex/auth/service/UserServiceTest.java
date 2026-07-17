package com.ledgex.auth.service;

import com.ledgex.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    public void testRegister() {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Test")
                .lastName("User")
                .email("test@example.com")
                .password("password123")
                .build();
        try {
            userService.register(request);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
