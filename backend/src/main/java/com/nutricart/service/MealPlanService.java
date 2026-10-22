package com.nutricart.service;

import com.nutricart.domain.MealPlan;
import com.nutricart.domain.MealPlanItem;
import com.nutricart.domain.PersonProfile;
import com.nutricart.domain.Recipe;
import com.nutricart.domain.UserAccount;
import com.nutricart.domain.enums.DayOfWeek;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.MealPlanItemRepository;
import com.nutricart.repository.MealPlanRepository;
import com.nutricart.repository.UserAccountRepository;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The weekly meal planner.
 *
 * <p>The plan itself is only the schedule; the shopping consequence is derived in
 * the browser from the same recipe ingredients that live in this database, so the
 * "Add this week to cart" button on the Meal Planner pushes only the quantities the
 * pantry cannot cover.
 */
@Service
public class MealPlanService {

    private final MealPlanRepository plans;
    private final MealPlanItemRepository items;
    private final CatalogueService catalogue;
    private final ProfileService profileService;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public MealPlanService(
            MealPlanRepository plans,
            MealPlanItemRepository items,
            CatalogueService catalogue,
            ProfileService profileService,
            UserAccountRepository users,
            DtoMapper mapper) {
        this.plans = plans;
        this.items = items;
        this.catalogue = catalogue;
        this.profileService = profileService;
        this.users = users;
        this.mapper = mapper;
    }

    /** Returns the requested week, creating an empty plan on first visit. */
    @Transactional
    public ShoppingDtos.MealPlanDto getWeek(Long userId, String weekStart) {
        return mapper.mealPlan(planFor(userId, parseWeekStart(weekStart)));
    }

    @Transactional
    public ShoppingDtos.MealPlanDto addItem(Long userId, ShoppingDtos.MealPlanItemRequest request) {
        if (request.recipeId() == null) {
            throw ApiException.field("recipeId", "Choose a recipe for this meal.");
        }
        Recipe recipe = catalogue.requireRecipe(request.recipeId());
        int servings = request.servings() == null || request.servings() < 1
                ? recipe.getServings()
                : request.servings();

        // The week the CLIENT is displaying wins: the browser always adds meals to the
        // calendar it is showing, so it sends `weekStart`. Direct API callers that omit
        // it land in the current week's plan (never a silently different one).
        LocalDate start = parseWeekStart(request.weekStart());
        MealPlan plan = planFor(userId, start);

        MealPlanItem item = new MealPlanItem();
        item.setMealPlan(plan);
        item.setDay(EnumParsing.dayOfWeek("day", request.day()));
        item.setSlot(EnumParsing.mealSlot("slot", request.slot()));
        item.setRecipe(recipe);
        item.setServings(servings);
        items.save(item);

        plan.getItems().add(item);
        plans.save(plan);
        return mapper.mealPlan(plan);
    }

    @Transactional
    public ShoppingDtos.MealPlanDto updateItem(Long userId, Long itemId, ShoppingDtos.MealPlanItemPatch patch) {
        MealPlanItem item = requireItem(userId, itemId);
        if (patch.recipeId() != null) {
            item.setRecipe(catalogue.requireRecipe(patch.recipeId()));
        }
        if (patch.servings() != null) {
            if (patch.servings() < 1) {
                throw ApiException.field("servings", "Servings must be at least 1.");
            }
            item.setServings(patch.servings());
        }
        if (patch.day() != null) {
            item.setDay(EnumParsing.dayOfWeek("day", patch.day()));
        }
        if (patch.slot() != null) {
            item.setSlot(EnumParsing.mealSlot("slot", patch.slot()));
        }
        items.save(item);
        return mapper.mealPlan(item.getMealPlan());
    }

    @Transactional
    public ShoppingDtos.MealPlanDto removeItem(Long userId, Long itemId) {
        MealPlanItem item = requireItem(userId, itemId);
        MealPlan plan = item.getMealPlan();
        plan.getItems().remove(item);
        items.delete(item);
        plans.save(plan);
        return mapper.mealPlan(plan);
    }

    @Transactional(readOnly = true)
    public MealPlanItem requireItem(Long userId, Long itemId) {
        return items.findByIdAndMealPlanUserId(itemId, userId)
                .orElseThrow(() -> ApiException.notFound("That planned meal no longer exists."));
    }

    /** Existing plan for the week, or a freshly created one. */
    private MealPlan planFor(Long userId, LocalDate start) {
        PersonProfile profile = activeProfileOrFail(userId);
        return plans.findByUserIdAndPersonProfileIdAndWeekStart(userId, profile.getId(), start)
                .orElseGet(() -> {
                    MealPlan plan = new MealPlan();
                    plan.setUser(requireUser(userId));
                    plan.setPersonProfileId(profile.getId());
                    plan.setWeekStart(start);
                    return plans.save(plan);
                });
    }

    private PersonProfile activeProfileOrFail(Long userId) {
        PersonProfile profile = profileService.activeProfile(userId);
        if (profile == null) {
            throw ApiException.badRequest("Create a person profile before planning meals.");
        }
        return profile;
    }

    private LocalDate parseWeekStart(String weekStart) {
        if (weekStart == null || weekStart.isBlank()) {
            return LocalDate.now().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        }
        try {
            return LocalDate.parse(weekStart.trim());
        } catch (RuntimeException invalid) {
            throw ApiException.field(
                    "weekStart", "Use an ISO date such as 2026-09-21 for the Monday of the week.");
        }
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}
