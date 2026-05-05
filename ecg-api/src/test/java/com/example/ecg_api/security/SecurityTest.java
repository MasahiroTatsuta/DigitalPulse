package com.example.ecg_api.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.*;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest
class SecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void unauthorized_access_shouldFail() throws Exception {
        mockMvc.perform(get("/patients"))
                .andExpect(status().isUnauthorized());
    }
}