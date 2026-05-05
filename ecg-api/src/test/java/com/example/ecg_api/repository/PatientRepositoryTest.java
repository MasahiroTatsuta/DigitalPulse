package com.example.ecg_api.repository;

import com.example.ecg_api.entity.Patient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class PatientRepositoryTest {

    @Autowired
    private PatientRepository repository;

    @Test
    void save_and_find() {
        Patient p = new Patient();
        p.setName("test");

        repository.save(p);

        List<Patient> list = repository.findAll();

        assertFalse(list.isEmpty());
    }
}