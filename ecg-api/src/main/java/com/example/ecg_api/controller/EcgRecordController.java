package com.example.ecg_api.controller;

import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.repository.EcgRecordRepository;
import com.example.ecg_api.dto.EcgRecordSummaryDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page; // 🌟 追加
import org.springframework.data.domain.PageRequest; // 🌟 追加
import org.springframework.data.domain.Pageable; // 🌟 追加
import org.springframework.web.bind.annotation.*;
// import java.util.List;

@RestController
@RequestMapping("/api/ecg")
public class EcgRecordController {

    @Autowired
    private EcgRecordRepository repository;

    // Entity -> DTO 変換ロジック
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

    // 🌟 ページネーション対応：全件取得
    @GetMapping("/all")
    public Page<EcgRecordSummaryDTO> getAllEcgRecords(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        // Pageインターフェースの map メソッドを使ってDTOに変換
        return repository.findAllByOrderByIdDesc(pageable).map(this::convertToDTO);
    }

    // 🌟 ページネーション対応：検索
    @GetMapping("/search")
    public Page<EcgRecordSummaryDTO> search(
        @RequestParam(required = false) Integer patientId,
        @RequestParam(required = false) Boolean isAnomaly,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return repository.searchRecords(patientId, isAnomaly, pageable).map(this::convertToDTO);
    }

    // 特定のIDの詳細取得（波形データが必要なため Entity をそのまま返す）
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

    // ※ summary API は Pageable を使う「all」で代用できるため、必要に応じて削除または固定値運用にします
    // @GetMapping("/summary")
    // public List<EcgRecordSummaryDTO> getEcgSummary() {
    //     return repository.findTop100ByOrderByIdAsc().stream()
    //             .map(this::convertToDTO)
    //             .collect(java.util.stream.Collectors.toList());
    // }
}