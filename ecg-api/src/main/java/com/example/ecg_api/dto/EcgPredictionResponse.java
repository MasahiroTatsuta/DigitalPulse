package com.example.ecg_api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class EcgPredictionResponse {
    @JsonProperty("prediction_code")
    private Integer predictionCode;

    @JsonProperty("prediction_name")
    private String predictionName;

    private String confidence;

    @JsonProperty("is_anomaly")
    private Boolean isAnomaly;

    @JsonProperty("generated_report")
    private String generatedReport; // ChatGPTが作った所見
}