package com.example.digitalpulse.controller;

import com.example.digitalpulse.dto.EcgPredictionRequest;
import com.example.digitalpulse.dto.EcgPredictionResponse;
import com.example.digitalpulse.service.AiInferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ecg")
@CrossOrigin(origins = {"http://localhost:3000", "https://digital-pulse-psi.vercel.app"})
public class EcgController {

    @Autowired
    private AiInferenceService aiInferenceService;

    // 🌟 [追加] 最新コードが反映されたか確認するためのテスト窓口
    @GetMapping("/test")
    public String test() {
        return "最新のコードが正常に動いています！";
    }

    // AI解析用のPOST窓口
    @PostMapping("/analyze")
    public ResponseEntity<EcgPredictionResponse> analyzeEcg(@RequestBody EcgPredictionRequest request) {
        // 👇 これを追加！これさえ出れば「最新のコード」が動いている証拠です
        System.out.println("★AI解析リクエストを受け取りました！データ数: " + request.getWaveform().size());
        
        try {
            EcgPredictionResponse response = aiInferenceService.predict(request.getWaveform());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}