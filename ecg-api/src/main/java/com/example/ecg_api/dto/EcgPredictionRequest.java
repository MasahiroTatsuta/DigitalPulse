package com.example.ecg_api.dto;

import java.util.List;
import lombok.Data;

@Data
public class EcgPredictionRequest {
    private List<Double> waveform;

    // 1. 空のコンストラクタ（Jacksonというライブラリがこれを使います）
    public EcgPredictionRequest() {}

    // 2. 引数ありのコンストラクタ
    public EcgPredictionRequest(List<Double> waveform) {
        this.waveform = waveform;
    }

    // 3. Getter（これがないとデータを送れません）
    public List<Double> getWaveform() {
        return waveform;
    }

    // 4. Setter（これがないとJSONからデータを流し込めません）
    public void setWaveform(List<Double> waveform) {
        this.waveform = waveform;
    }
}