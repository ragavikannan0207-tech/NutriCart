package com.nutricart.web;

import com.nutricart.dto.ShoppingDtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.MealPlanService;
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
 * Weekly meal planner.
 *
 * <p>The plan is the schedule; the "Add this week to cart" consequence is derived
 * from the same recipe ingredients stored here, so only the quantities the pantry
 * cannot cover are ever pushed into the cart.
 */
@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {

    private final MealPlanService mealPlanService;

    public MealPlanController(MealPlanService mealPlanService) {
        this.mealPlanService = mealPlanService;
    }

    /** Returns the week's plan, creating an empty one on first visit. */
    @GetMapping
    public ShoppingDtos.MealPlanDto getWeek(@RequestParam(name = "weekStart", required = false) String weekStart) {
        return mealPlanService.getWeek(CurrentUser.id(), weekStart);
    }

    @PostMapping("/items")
    public ShoppingDtos.MealPlanDto addItem(@RequestBody ShoppingDtos.MealPlanItemRequest request) {
        return mealPlanService.addItem(CurrentUser.id(), request);
    }

    @PutMapping("/items/{id}")
    public ShoppingDtos.MealPlanDto updateItem(
            @PathVariable Long id, @RequestBody ShoppingDtos.MealPlanItemPatch patch) {
        return mealPlanService.updateItem(CurrentUser.id(), id, patch);
    }

    @DeleteMapping("/items/{id}")
    public ShoppingDtos.MealPlanDto removeItem(@PathVariable Long id) {
        return mealPlanService.removeItem(CurrentUser.id(), id);
    }
}