package com.example.ecg_api.service;

import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.dto.EcgPredictionResponse;
import com.example.ecg_api.repository.EcgRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class EcgImportService {

    @Autowired
    private AiInferenceService aiInferenceService;

    @Autowired
    private EcgRecordRepository ecgRecordRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void importCsv(MultipartFile file) throws Exception {
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT)) {

            for (CSVRecord csvRecord : csvParser) {
                // 1. CSVの1行から187個の波形データを抽出
                List<Double> waveform = new ArrayList<>();
                for (int i = 0; i < 187; i++) {
                    waveform.add(Double.parseDouble(csvRecord.get(i)));
                }

                // 2. 既存のAIサービスを呼び出し
                EcgPredictionResponse aiResult = aiInferenceService.predict(waveform);

                // 3. エンティティにマッピング
                EcgRecord record = new EcgRecord();
                // ※ idがAutoIncrement設定でない場合は手動採番が必要ですが、通常はDB側に任せます
                
                // 波形データをJSON形式の文字列として保存
                record.setWaveformData(objectMapper.writeValueAsString(waveform));
                
                // AIの結果を各カラムにセット
                record.setIsAnomaly(aiResult.getIsAnomaly());
                record.setDiagnosisType(aiResult.getPredictionCode());
                
                // 判定名とレポートを合体させてコメント欄に保存（既存カラムの活用）
                String fullComment = String.format("【AI判定: %s (信頼度: %s)】\n%s", 
                    aiResult.getPredictionName(), 
                    aiResult.getConfidence(), 
                    aiResult.getGeneratedReport());
                record.setDoctorComment(fullComment);
                
                record.setRecordedAt(LocalDateTime.now());

                // 4. DBに保存
                ecgRecordRepository.save(record);
            }
        }
    }
}