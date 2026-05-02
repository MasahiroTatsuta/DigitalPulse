package com.example.ecg_api.controller;

import com.example.ecg_api.dto.EcgPredictionRequest;
import com.example.ecg_api.dto.EcgPredictionResponse;
import com.example.ecg_api.service.AiInferenceService;
import com.example.ecg_api.service.EcgImportService;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ecg")
public class EcgController {

    @Autowired
    private AiInferenceService aiInferenceService;
    private EcgImportService ecgImportService;

    // 🌟 [追加 ] 最新コードが反映されたか確認するためのテスト窓口
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

    @PostMapping("/import")
    public ResponseEntity<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            ecgImportService.importCsv(file);
            return ResponseEntity.ok("CSVのインポートとAI解析が完了しました！");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("エラー: " + e.getMessage());
        }
    }
}