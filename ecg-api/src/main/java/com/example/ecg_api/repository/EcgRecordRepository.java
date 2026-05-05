package com.example.ecg_api.repository;

import com.example.ecg_api.entity.EcgRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EcgRecordRepository extends JpaRepository<EcgRecord, Integer> {
    List<EcgRecord> findAllByOrderByIdDesc();
    
    // 患者IDと異常フラグで検索するメソッド（部分一致やNULL対応も考慮）
    @Query("SELECT e FROM EcgRecord e WHERE " +
       "(:patientId IS NULL OR e.patient.id = :patientId) AND " + // ← ここを修正
       "(:isAnomaly IS NULL OR e.isAnomaly = :isAnomaly) " +
       "ORDER BY e.id ASC")
    List<EcgRecord> searchRecords(
        @Param("patientId") Integer patientId, 
        @Param("isAnomaly") Boolean isAnomaly
    );

    List<EcgRecord> findTop100ByOrderByIdAsc();
}
