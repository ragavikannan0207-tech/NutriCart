package com.nutricart.web;

import com.nutricart.dto.Dtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.AddressService;
import com.nutricart.service.ProfileService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Person profiles — one account can hold many people.
 * The active profile drives every personalised screen in the app.
 */
@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public List<Dtos.ProfileDto> list() {
        return profileService.list(CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<Dtos.ProfileDto> create(@RequestBody Dtos.ProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(profileService.create(CurrentUser.id(), request));
    }

    @PutMapping("/{id}")
    public Dtos.ProfileDto update(@PathVariable Long id, @RequestBody Dtos.ProfileRequest request) {
        return profileService.update(CurrentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        profileService.delete(CurrentUser.id(), id);
        return ResponseEntity.noContent().build();
    }

    /** "Shopping for …" — returns the refreshed list so the UI can re-render at once. */
    @PostMapping("/{id}/activate")
    public List<Dtos.ProfileDto> activate(@PathVariable Long id) {
        return profileService.setActive(CurrentUser.id(), id);
    }
}