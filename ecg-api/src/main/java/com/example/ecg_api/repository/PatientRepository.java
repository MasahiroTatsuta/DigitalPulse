package com.example.ecg_api.repository;

import com.example.ecg_api.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {
    // 基本的な保存・検索機能は JpaRepository が自動で提供します
}