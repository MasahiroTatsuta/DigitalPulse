package com.example.ecg_api.controller;

import com.example.ecg_api.entity.User;
import com.example.ecg_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {

        System.out.println("=== LOGIN REQUEST START ===");

        String username = credentials.get("username");
        String password = credentials.get("password");

        System.out.println("username: " + username);
        System.out.println("password: " + password);

        if (username == null || password == null) {
            System.out.println("❌ Missing credentials");
            return ResponseEntity.badRequest().body("missing credentials");
        }

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            System.out.println("❌ USER NOT FOUND");
            return ResponseEntity.status(401).body("user not found");
        }

        User user = userOpt.get();

        System.out.println("DB password: " + user.getPassword());

        // ⚠️ 今は簡易比較（あとで必ずbcryptにする）
        boolean match = user.getPassword().equals(password);

        System.out.println("password match: " + match);

        if (!match) {
            System.out.println("❌ PASSWORD MISMATCH");
            return ResponseEntity.status(401).body("password mismatch");
        }

        System.out.println("✅ LOGIN SUCCESS");

        // 🔥 NextAuth用レスポンス（重要）
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());

        System.out.println("response: " + response);

        return ResponseEntity.ok(response);
    }
}