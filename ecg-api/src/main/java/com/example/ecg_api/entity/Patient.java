// Patient.java
package com.example.ecg_api.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "patients")
@Data
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private Integer age;
    private String gender;
}