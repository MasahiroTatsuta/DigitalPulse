package com.example.ecg_api.service;

import org.springframework.transaction.annotation.Transactional;
import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.dto.EcgPredictionResponse;
import com.example.ecg_api.repository.EcgRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

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

    @Async
    @Transactional
    public void processExistingRecords() throws Exception {
        // 1. 「コメントがまだ無い」データを、IDの古い順（ASC）に取得し、さらに「先頭50件」に絞る
        // これなら30秒以内で確実に終わりますし、何度も実行すれば全部埋まります。
        List<EcgRecord> pendingRecords = ecgRecordRepository.findAll().stream()
            .filter(r -> r.getDoctorComment() == null || r.getDoctorComment().isEmpty())
            .sorted(Comparator.comparing(EcgRecord::getId)) // ID順に並べる
            .limit(50) // 🌟 一回のリクエストで50件ずつ攻める（安全策）
            .toList();

        System.out.println("★今回の解析対象（残り分から先頭50件）: " + pendingRecords.size());

        for (EcgRecord record : pendingRecords) {
            try {
                List<Double> waveform = objectMapper.readValue(record.getWaveformData(), 
                    new TypeReference<List<Double>>() {});

                EcgPredictionResponse aiResult = aiInferenceService.predict(waveform);

                record.setIsAnomaly(aiResult.getIsAnomaly());
                record.setDiagnosisType(aiResult.getPredictionCode());
                record.setDoctorComment(String.format("【AI判定: %s】\n%s", 
                    aiResult.getPredictionName(), aiResult.getGeneratedReport()));
                
                ecgRecordRepository.save(record);
                System.out.println("✅ ID: " + record.getId() + " を更新しました");
            } catch (Exception e) {
                System.err.println("❌ ID: " + record.getId() + " でエラー発生: " + e.getMessage());
            }
        }
        System.out.println("🏁 今回の50件のバッチ処理が完了しました！");
    }
}