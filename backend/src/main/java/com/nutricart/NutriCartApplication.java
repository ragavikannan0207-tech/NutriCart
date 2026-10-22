package com.nutricart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * NutriCart — Smart Grocery and Healthy Food Recommendation System.
 *
 * <p>Architecture: REST controllers -> services -> Spring Data JPA repositories -> MySQL.
 * The React frontend in /frontend consumes exactly these endpoints under /api.
 */
@SpringBootApplication
@EnableScheduling
public class NutriCartApplication {

    public static void main(String[] args) {
        SpringApplication.run(NutriCartApplication.class, args);
    }
}
