package com.example.ecg_api.controller;

import com.example.ecg_api.entity.Patient;
import com.example.ecg_api.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PatientController.class)
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PatientRepository repository;

    @Test
    void getPatients_shouldReturn200() throws Exception {
        when(repository.findAll()).thenReturn(List.of(new Patient()));

        mockMvc.perform(get("/patients"))
                .andExpect(status().isOk());
    }
}