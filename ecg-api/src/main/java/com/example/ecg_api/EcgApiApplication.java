package com.example.ecg_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EcgApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(EcgApiApplication.class, args);
	}

}
