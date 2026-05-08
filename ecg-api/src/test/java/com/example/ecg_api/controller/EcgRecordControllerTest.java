package com.example.ecg_api.controller;

import com.example.ecg_api.entity.EcgRecord;
import com.example.ecg_api.entity.Patient;
import com.example.ecg_api.repository.EcgRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class EcgRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EcgRecordRepository repository;

    private EcgRecord mockRecord;

    @BeforeEach
    void setUp() {
        // テスト用の擬似データ作成
        Patient patient = new Patient();
        patient.setId(502);
        patient.setName("テスト患者");

        mockRecord = new EcgRecord();
        mockRecord.setId(1);
        mockRecord.setPatient(patient);
        mockRecord.setIsAnomaly(true); // Entity側は isAnomaly
        mockRecord.setWaveformData("[0.1, 0.2, 0.3]"); // 重いデータ
        mockRecord.setDoctorComment("テストコメント");
    }

    @Test
    void 一覧APIは波形データを含まずに正しいJSONキーを返すこと() throws Exception {
        // リポジトリがPageオブジェクトを返すように設定
        List<EcgRecord> records = Collections.singletonList(mockRecord);
        PageImpl<EcgRecord> page = new PageImpl<>(records, PageRequest.of(0, 20), 1);

        Mockito.when(repository.findAllByOrderByIdDesc(Mockito.any())).thenReturn(page);

        mockMvc.perform(get("/api/ecg/all")
                .param("page", "0")
                .param("size", "20")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                // 🌟 ここが重要：isAnomaly ではなく anomaly というキーで返ってきているか
                .andExpect(jsonPath("$.content[0].anomaly").value(true))
                // 🌟 ここが重要：waveformData が JSON に含まれていないか
                .andExpect(jsonPath("$.content[0].waveformData").doesNotExist())
                // ページネーション構造の確認
                .andExpect(jsonPath("$.totalPages").exists())
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}