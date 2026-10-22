package com.nutricart.web;

import com.nutricart.dto.Dtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication endpoints — the entry point of the whole application.
 *
 * <p>There is no public grocery homepage: the React router lands on /login and only
 * reaches the storefront with a valid bearer token issued here.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** New accounts always continue into Profile Setup, never straight to Overview. */
    @PostMapping("/register")
    public ResponseEntity<Dtos.SessionResponse> register(@RequestBody Dtos.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public Dtos.SessionResponse login(@RequestBody Dtos.LoginRequest request) {
        return authService.login(request);
    }

    /** Confirms a cached token is still valid when the app boots. */
    @GetMapping("/session")
    public Dtos.SessionResponse session() {
        return authService.currentSession(CurrentUser.id());
    }

    /** Stateless sign-out: the client drops its token; the account is untouched. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.noContent().build();
    }
}