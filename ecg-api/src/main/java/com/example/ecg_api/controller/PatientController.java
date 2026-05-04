package com.example.ecg_api.controller;

import com.example.ecg_api.entity.Patient;
import com.example.ecg_api.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    // 患者一覧取得
    @GetMapping
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    // 患者登録
    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient savedPatient = patientRepository.save(patient);
        return ResponseEntity.ok(savedPatient);
    }

    // 特定の患者取得
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatient(@PathVariable Integer id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}