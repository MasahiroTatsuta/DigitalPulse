package com.example.ecg_api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.ecg_api.dto.EcgPredictionRequest;
import com.example.ecg_api.dto.EcgPredictionResponse;

import org.springframework.beans.factory.annotation.Value;

import java.util.List;

@Service
public class AiInferenceService {

    // Cloud RunのURL（後でapplication.propertiesに設定します）
    @Value("${ai.api.url}")
    private String aiApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public EcgPredictionResponse predict(List<Double> waveform) {
        EcgPredictionRequest request = new EcgPredictionRequest(waveform);
        
        try {
            // FastAPI(Cloud Run)にPOSTリクエストを送信
            return restTemplate.postForObject(aiApiUrl + "/api/predict", request, EcgPredictionResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("AI解析の呼び出しに失敗しました: " + e.getMessage());
        }
    }
}