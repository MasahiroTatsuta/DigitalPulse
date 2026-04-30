package com.example.ecg_api.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(unique = true)
    private String username;
    
    private String password;
    
    @Column(name = "display_name") // DBのカラム名に合わせる
    private String displayName;
    
    private String role;
}