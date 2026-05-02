package com.example.digitalpulse.dto;

import lombok.Data;

@Data
public class EcgPredictionResponse {
    private int prediction_code;
    private String prediction_name;
    private String confidence;
    private boolean is_anomaly;
    private String generated_report; // ChatGPTが作った所見
}