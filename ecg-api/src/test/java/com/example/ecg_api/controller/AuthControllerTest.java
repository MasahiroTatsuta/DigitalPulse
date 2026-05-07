package com.example.ecg_api.controller;

import com.example.ecg_api.entity.User;
import com.example.ecg_api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    // API-01 (A01): 正常ログイン
    @Test
    void testLoginSuccess() throws Exception {
        User mockUser = new User();
        mockUser.setId(1);
        mockUser.setUsername("admin");
        mockUser.setPassword("password123");

        // モックデータ設定: Optional.of(mockUser)
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\", \"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("admin"));
    }

    // API-02 (A02): 存在しないユーザー
    @Test
    void testLoginUserNotFound() throws Exception {
        // モックデータ設定: Optional.empty()
        when(userRepository.findByUsername("not_exist")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"not_exist\", \"password\":\"password123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("user not found"));
    }

    // API-03 (A03): パスワード不一致
    @Test
    void testLoginPasswordMismatch() throws Exception {
        User mockUser = new User();
        mockUser.setUsername("admin");
        mockUser.setPassword("password123");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\", \"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("password mismatch"));
    }

    // API-04 (A04): usernameがnull
    @Test
    void testLoginUsernameNull() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("missing credentials"));
    }

    // API-05 (A05): passwordがnull
    @Test
    void testLoginPasswordNull() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("missing credentials"));
    }

    // API-06 (A06): 空ボディ
    @Test
    void testLoginEmptyBody() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("missing credentials"));
    }

    // API-07 (A07): 不正Content-Type
    @Test
    void testLoginInvalidContentType() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("username", "admin")
                .param("password", "password123"))
                .andExpect(status().isUnsupportedMediaType()); // Spring Bootデフォルトの415動作確認
    }

    // API-08 (A08): 不正JSON
    @Test
    void testLoginInvalidJson() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{username: admin}")) // クォートなしの不正なJSON
                .andExpect(status().isBadRequest());
    }
}