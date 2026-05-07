package com.example.ecg_api.controller;

import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.repository.EcgRecordRepository;
import com.example.ecg_api.dto.EcgRecordSummaryDTO; // 🌟 追加
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors; // 🌟 追加

@RestController
@RequestMapping("/api/ecg")
public class EcgRecordController {

    @Autowired
    private EcgRecordRepository repository;

    // 🌟 共通の変換メソッド（Entity -> DTO）を作成しておくとスッキリします
    private EcgRecordSummaryDTO convertToDTO(EcgRecord record) {
        return new EcgRecordSummaryDTO(
            record.getId(),
            record.getPatient() != null ? record.getPatient().getId() : null,
            record.getPatient() != null ? record.getPatient().getName() : "GUEST",
            record.getIsAnomaly(),
            record.getDoctorComment(),
            record.getRecordedAt()
        );
    }

    @GetMapping("/all")
    public List<EcgRecordSummaryDTO> getAllEcgRecords() {
        // 全件取得し、DTOに変換して返す（波形データは含まれない）
        return repository.findAllByOrderByIdDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/summary")
    public List<EcgRecordSummaryDTO> getEcgSummary() {
        // 直近100件をDTOに変換して返す
        return repository.findTop100ByOrderByIdAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/search")
    public List<EcgRecordSummaryDTO> search(
        @RequestParam(required = false) Integer patientId,
        @RequestParam(required = false) Boolean isAnomaly
    ) {
        // 検索結果をDTOに変換して返す
        return repository.searchRecords(patientId, isAnomaly).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 🌟 【重要】詳細は波形が必要なので Entity (EcgRecord) をそのまま返す
    @GetMapping("/{id}")
    public EcgRecord getEcgRecordById(@PathVariable Integer id) {
        return repository.findById(id).orElse(null);
    }

    @PutMapping("/{id}/comment")
    public void updateComment(@PathVariable Integer id, @RequestBody String comment) {
        EcgRecord record = repository.findById(id).orElse(null);
        if (record != null) {
            record.setDoctorComment(comment);
            repository.save(record);
        }
    }
}