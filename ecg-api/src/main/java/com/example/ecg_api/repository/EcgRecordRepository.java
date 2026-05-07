package com.example.ecg_api.repository;

import com.example.ecg_api.entity.EcgRecord;
import org.springframework.data.domain.Page; // 🌟 追加
import org.springframework.data.domain.Pageable; // 🌟 追加
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EcgRecordRepository extends JpaRepository<EcgRecord, Integer> {
    
    // 🌟 List から Page に変更し、Pageable を引数に追加
    Page<EcgRecord> findAllByOrderByIdDesc(Pageable pageable);
    
    @Query("SELECT e FROM EcgRecord e WHERE " +
       "(:patientId IS NULL OR e.patient.id = :patientId) AND " +
       "(:isAnomaly IS NULL OR e.isAnomaly = :isAnomaly) " +
       "ORDER BY e.id DESC") // DESC（降順）に揃えるのが一般的です
    Page<EcgRecord> searchRecords(
        @Param("patientId") Integer patientId, 
        @Param("isAnomaly") Boolean isAnomaly,
        Pageable pageable // 🌟 追加
    );
}