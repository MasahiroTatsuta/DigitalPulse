package com.example.ecg_api.controller;

import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.repository.EcgRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.List;

@RestController
@RequestMapping("/api/ecg")
// @CrossOrigin(origins = "*") // フロントエンド(Next.js)からのアクセスを許可する設定
public class EcgRecordController {

    @Autowired
    private EcgRecordRepository repository;

    @GetMapping("/all")
    public List<EcgRecord> getAllEcgRecords() {
        // IDの新しい順（降順）ですべて取得する
        return repository.findAll(); 
    }

    // 一覧データを100件取得するAPI (http://localhost:8080/api/ecg/summary)
    @GetMapping("/summary")
    public List<EcgRecord> getEcgSummary() {
        return repository.findTop100ByOrderByIdAsc();
    }

    // 例: GET http://localhost:8080/api/ecg/1 にアクセスしたときの処理API
    @GetMapping("/{id}")
    public EcgRecord getEcgRecordById(@PathVariable Integer id) {
        // データベースからIDを指定して1件取得し、フロントエンドにJSONとして返す
        return repository.findById(id).orElse(null);
    }

    // 患者ID、異常フラグからデータを絞り込んで検索するAPI (http://localhost:8080/api/ecg/search)
    @GetMapping("/search")
    public List<EcgRecord> search(
        @RequestParam(required = false) Integer patientId,
        @RequestParam(required = false) Boolean isAnomaly
    ) {
        return repository.searchRecords(patientId, isAnomaly);
    }

    // コメントを更新するAPI
    @PutMapping("/{id}/comment")
    public void updateComment(@PathVariable Integer id, @RequestBody String comment) {
        EcgRecord record = repository.findById(id).orElse(null);
        if (record != null) {
            record.setDoctorComment(comment);
            repository.save(record);
        }
    }
}
