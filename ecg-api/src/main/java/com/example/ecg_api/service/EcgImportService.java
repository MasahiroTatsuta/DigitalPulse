package com.example.ecg_api.service;

import org.springframework.transaction.annotation.Transactional;
import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.entity.Patient;
import com.example.ecg_api.dto.EcgPredictionResponse;
import com.example.ecg_api.repository.EcgRecordRepository;
import com.example.ecg_api.repository.PatientRepository;
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

    @Autowired
    private PatientRepository patientRepository; // 🌟 ここで追加したリポジトリを使います

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void importCsv(MultipartFile file, Integer patientId) throws Exception {
        // インポート前に患者が存在するか確認
        Patient patient = null;
        if (patientId != null) {
            patient = patientRepository.findById(patientId).orElse(null);
        }

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT)) {

            for (CSVRecord csvRecord : csvParser) {
                List<Double> waveform = new ArrayList<>();
                // MIT-BIH形式(187列)を想定
                for (int i = 0; i < 187; i++) {
                    waveform.add(Double.parseDouble(csvRecord.get(i)));
                }

                // AI解析
                EcgPredictionResponse aiResult = aiInferenceService.predict(waveform);

                EcgRecord record = new EcgRecord();
                record.setPatient(patient); // 🌟 患者を紐付け
                record.setWaveformData(objectMapper.writeValueAsString(waveform));
                record.setIsAnomaly(aiResult.getIsAnomaly());
                record.setDiagnosisType(aiResult.getPredictionCode());
                
                String fullComment = String.format("【AI判定: %s (信頼度: %s)】\n%s", 
                    aiResult.getPredictionName(), 
                    aiResult.getConfidence(), 
                    aiResult.getGeneratedReport());
                record.setDoctorComment(fullComment);
                record.setRecordedAt(LocalDateTime.now());

                ecgRecordRepository.save(record);
            }
        }
    }

    @Async
    @Transactional
    public void processExistingRecords() throws Exception {
        List<EcgRecord> pendingRecords = ecgRecordRepository.findAll().stream()
            .filter(r -> r.getDoctorComment() == null || r.getDoctorComment().isEmpty())
            .sorted(Comparator.comparing(EcgRecord::getId))
            .limit(50)
            .toList();

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
            } catch (Exception e) {
                System.err.println("❌ ID: " + record.getId() + " でエラー発生: " + e.getMessage());
            }
        }
    }
}