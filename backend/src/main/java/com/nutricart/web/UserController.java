package com.nutricart.web;

import com.nutricart.dto.Dtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.AuthService;
import com.nutricart.service.PreferenceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in account itself plus its application preferences. */
@RestController
@RequestMapping("/api")
public class UserController {

    private final AuthService authService;
    private final PreferenceService preferenceService;

    public UserController(AuthService authService, PreferenceService preferenceService) {
        this.authService = authService;
        this.preferenceService = preferenceService;
    }

    @PutMapping("/users/me")
    public Dtos.SessionResponse updateAccount(@RequestBody Dtos.AccountRequest request) {
        return authService.updateAccount(CurrentUser.id(), request);
    }

    @GetMapping("/preferences")
    public Dtos.PreferencesDto preferences() {
        return preferenceService.get(CurrentUser.id());
    }

    /** Every switch on Settings → Notifications / Preferences is persisted here. */
    @PutMapping("/preferences")
    public Dtos.PreferencesDto savePreferences(@RequestBody Dtos.PreferencesDto request) {
        return preferenceService.save(CurrentUser.id(), request);
    }

    /** Marks today as the last pantry review (drives the review reminder). */
    @org.springframework.web.bind.annotation.PostMapping("/preferences/pantry-review")
    public Dtos.PreferencesDto markPantryReviewed() {
        return preferenceService.markPantryReviewed(CurrentUser.id());
    }
}