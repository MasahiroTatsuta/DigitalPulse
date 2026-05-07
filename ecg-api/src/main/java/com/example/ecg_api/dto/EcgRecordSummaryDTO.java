package com.example.ecg_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EcgRecordSummaryDTO {
    private Integer id;
    private Integer patientId;
    private String patientName;
    private boolean isAnomaly;
    private String doctorComment;
    private LocalDateTime recordedAt;
}