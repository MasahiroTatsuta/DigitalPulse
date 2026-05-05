package com.example.ecg_api.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "ecg_records")
public class EcgRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "is_anomaly")
    private Boolean isAnomaly;

    @Column(name = "waveform_data", columnDefinition = "json")
    private String waveformData;

    @Column(name = "doctor_comment", columnDefinition = "TEXT") // 🌟 columnDefinitionを追加
    private String doctorComment;

    @Column(name = "diagnosis_type")
    private Integer diagnosisType;

}
