package com.example.ecg_api.controller;

import com.example.ecg_api.entity.User;
import com.example.ecg_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public User login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        return userRepository.findByUsername(username)
                .filter(user -> user.getPassword().equals(password)) // ※本来はハッシュ化すべきですが、まずは簡易実装で
                .orElse(null);
    }
}