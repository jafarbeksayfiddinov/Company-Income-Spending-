package com.construction.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CompanyIncomeSpendApplication {
    public static void main(String[] args) {
        SpringApplication.run(CompanyIncomeSpendApplication.class, args);
    }
}
