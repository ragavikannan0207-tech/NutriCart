package com.nutricart.web;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unauthenticated probe the React client calls on boot.
 *
 * <p>When this answers {@code UP} the frontend switches to the Spring Boot data
 * layer; when it does not, the app keeps working on its built-in browser
 * persistence layer with the same contracts (see frontend/src/services/index.ts).
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "nutricart",
                "time", Instant.now().toString());
    }
}