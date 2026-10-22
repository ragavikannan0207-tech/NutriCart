package com.nutricart.web;

import com.nutricart.dto.ShoppingDtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.PantryService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * My Pantry — the kitchen inventory, never the cart.
 * Freshness for unpackaged produce is estimated and flagged as such; expired items
 * are never deleted automatically.
 */
@RestController
@RequestMapping("/api/pantry")
public class PantryController {

    private final PantryService pantryService;

    public PantryController(PantryService pantryService) {
        this.pantryService = pantryService;
    }

    @GetMapping
    public List<ShoppingDtos.PantryItemDto> list(
            @RequestParam(name = "personProfileId", required = false) Long personProfileId) {
        return pantryService.list(CurrentUser.id(), personProfileId);
    }

    @PostMapping
    public ResponseEntity<ShoppingDtos.PantryItemDto> create(@RequestBody ShoppingDtos.PantryItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pantryService.create(CurrentUser.id(), request));
    }

    @PutMapping("/{id}")
    public ShoppingDtos.PantryItemDto update(
            @PathVariable Long id, @RequestBody ShoppingDtos.PantryItemRequest request) {
        return pantryService.update(CurrentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        pantryService.remove(CurrentUser.id(), id);
        return ResponseEntity.noContent().build();
    }

    /** − 1 / + 1 from the pantry list; a quantity of zero removes the item. */
    @PostMapping("/{id}/adjust")
    public ShoppingDtos.PantryAdjustResponse adjust(
            @PathVariable Long id, @RequestBody ShoppingDtos.DeltaRequest request) {
        return pantryService.adjust(CurrentUser.id(), id, request.delta());
    }
}