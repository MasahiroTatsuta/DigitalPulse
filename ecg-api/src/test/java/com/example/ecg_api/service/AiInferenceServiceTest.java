package com.example.ecg_api.service;

import com.example.ecg_api.dto.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class AiInferenceServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AiInferenceService service;

    @Test
    void predict_shouldReturnResult() {
        EcgPredictionRequest req = new EcgPredictionRequest();
        req.setSignal(List.of(0.1, 0.2));

        EcgPredictionResponse resMock = new EcgPredictionResponse();
        resMock.setResult("NORMAL");

        when(restTemplate.postForObject(anyString(), any(), eq(EcgPredictionResponse.class)))
                .thenReturn(resMock);

        EcgPredictionResponse res = service.predict(req);

        assertEquals("NORMAL", res.getResult());
    }
}