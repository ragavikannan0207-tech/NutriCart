package com.nutricart.web;

import com.nutricart.dto.ShoppingDtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.BudgetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Weekly / monthly grocery budget, per person profile.
 * The amount is a user setting; the spend is derived from real orders only.
 */
@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    /**
     * 200 with an empty body when nothing has been set yet — the React client
     * reads that as "no budget", which is exactly the empty state the Budget page
     * renders, and no red 404 lands in the browser console on every screen.
     * An unknown or foreign person profile still returns 404 (validated in the
     * service against the caller's own profiles).
     */
    @GetMapping
    public ResponseEntity<ShoppingDtos.BudgetDto> get(
            @RequestParam(name = "personProfileId", required = false) Long personProfileId) {
        ShoppingDtos.BudgetDto budget = budgetService.get(CurrentUser.id(), personProfileId);
        return ResponseEntity.ok(budget);
    }

    @PutMapping
    public ShoppingDtos.BudgetDto save(@RequestBody ShoppingDtos.BudgetRequest request) {
        return budgetService.save(CurrentUser.id(), request);
    }
}