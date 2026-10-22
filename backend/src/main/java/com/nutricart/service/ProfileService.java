package com.nutricart.service;

import com.nutricart.domain.Order;
import com.nutricart.domain.PersonProfile;
import com.nutricart.domain.UserAccount;
import com.nutricart.dto.Dtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.BudgetRepository;
import com.nutricart.repository.MealPlanRepository;
import com.nutricart.repository.OrderRepository;
import com.nutricart.repository.PantryItemRepository;
import com.nutricart.repository.PersonProfileRepository;
import com.nutricart.repository.UserAccountRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Person profiles — one account, many people.
 *
 * <p>Exactly one profile is active at a time; the active profile drives Shop
 * recommendations, Smart Grocery, Pantry, Recipes, Meal Planner, For You,
 * Purchased Nutrition, Budget and Healthy Alternatives.
 */
@Service
public class ProfileService {

    private final PersonProfileRepository profiles;
    private final UserAccountRepository users;
    private final PantryItemRepository pantry;
    private final MealPlanRepository mealPlans;
    private final BudgetRepository budgets;
    private final OrderRepository orders;
    private final DtoMapper mapper;

    public ProfileService(
            PersonProfileRepository profiles,
            UserAccountRepository users,
            PantryItemRepository pantry,
            MealPlanRepository mealPlans,
            BudgetRepository budgets,
            OrderRepository orders,
            DtoMapper mapper) {
        this.profiles = profiles;
        this.users = users;
        this.pantry = pantry;
        this.mealPlans = mealPlans;
        this.budgets = budgets;
        this.orders = orders;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<Dtos.ProfileDto> list(Long userId) {
        return profiles.findByUserIdOrderByIdAsc(userId).stream().map(mapper::profile).toList();
    }

    @Transactional
    public Dtos.ProfileDto create(Long userId, Dtos.ProfileRequest request) {
        UserAccount account = requireUser(userId);
        List<PersonProfile> existing = profiles.findByUserIdOrderByIdAsc(userId);

        PersonProfile profile = new PersonProfile();
        profile.setUser(account);
        applyRequest(profile, request);

        // The first profile on an account becomes the active one automatically.
        boolean makeActive = existing.isEmpty() || Boolean.TRUE.equals(request.isActive());
        profile.setActive(makeActive);
        PersonProfile saved = profiles.save(profile);

        if (makeActive) {
            deactivateOthers(userId, saved.getId());
        }
        return mapper.profile(saved);
    }

    @Transactional
    public Dtos.ProfileDto update(Long userId, Long id, Dtos.ProfileRequest request) {
        PersonProfile profile = require(userId, id);
        applyRequest(profile, request);
        if (Boolean.TRUE.equals(request.isActive())) {
            profile.setActive(true);
        }
        PersonProfile saved = profiles.save(profile);
        if (saved.isActive()) {
            deactivateOthers(userId, saved.getId());
        }
        return mapper.profile(saved);
    }

    /**
     * Removes a person together with their pantry, meal plans and budget. Orders,
     * invoices and purchased-nutrition history are deliberately kept: the order is
     * detached from the profile but keeps its own name, address and price snapshot.
     */
    @Transactional
    public void delete(Long userId, Long id) {
        PersonProfile profile = require(userId, id);
        if (profiles.countByUserId(userId) <= 1) {
            throw ApiException.badRequest("At least one person profile has to stay on the account.");
        }
        boolean wasActive = profile.isActive();

        List<Order> personOrders = orders.findByPersonId(profile.getId());
        personOrders.forEach(order -> order.setPerson(null));
        orders.saveAll(personOrders);

        pantry.deleteByPersonProfileId(profile.getId());
        mealPlans.deleteByPersonProfileId(profile.getId());
        budgets.deleteByPersonProfileId(profile.getId());
        profiles.delete(profile);
        profiles.flush();

        if (wasActive) {
            List<PersonProfile> remaining = profiles.findByUserIdOrderByIdAsc(userId);
            if (!remaining.isEmpty()) {
                remaining.get(0).setActive(true);
                profiles.save(remaining.get(0));
            }
        }
    }

    /** Switches the active person and returns the refreshed list. */
    @Transactional
    public List<Dtos.ProfileDto> setActive(Long userId, Long id) {
        PersonProfile profile = require(userId, id);
        deactivateOthers(userId, profile.getId());
        profile.setActive(true);
        profiles.save(profile);
        return list(userId);
    }

    @Transactional(readOnly = true)
    public PersonProfile require(Long userId, Long id) {
        return profiles.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("That person profile no longer exists."));
    }

    /** The active person, or the first one when nothing is flagged yet. */
    @Transactional(readOnly = true)
    public PersonProfile activeProfile(Long userId) {
        return profiles.findFirstByUserIdAndActiveTrue(userId)
                .orElseGet(() -> profiles.findByUserIdOrderByIdAsc(userId).stream().findFirst().orElse(null));
    }

    private void applyRequest(PersonProfile profile, Dtos.ProfileRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.length() < 2) {
            throw ApiException.field("name", "Enter the person's name.");
        }
        int age = request.age() == null ? 0 : request.age();
        if (age < 1 || age > 100) {
            throw ApiException.field("age", "Age must be between 1 and 100.");
        }
        double height = request.heightCm() == null ? 0 : request.heightCm();
        if (height < 80 || height > 250) {
            throw ApiException.field("heightCm", "Height must be between 80 and 250 cm.");
        }
        double weight = request.weightKg() == null ? 0 : request.weightKg();
        if (weight < 15 || weight > 300) {
            throw ApiException.field("weightKg", "Weight must be between 15 and 300 kg.");
        }

        profile.setName(name);
        profile.setAge(age);
        profile.setGender(EnumParsing.gender("gender", request.gender()));
        profile.setHeightCm(height);
        profile.setWeightKg(weight);
        profile.setActivityLevel(EnumParsing.activityLevel("activityLevel", request.activityLevel()));
        profile.setDietType(EnumParsing.dietType("dietType", request.dietType()));
        profile.setHealthGoal(EnumParsing.healthGoal("healthGoal", request.healthGoal()));
        profile.setBudgetAmount(request.budgetAmount() == null ? 0 : Math.max(0, request.budgetAmount()));
        profile.setBudgetPeriod(EnumParsing.budgetPeriod("budgetPeriod", request.budgetPeriod()));
        profile.setAllergies(clean(request.allergies()));
        profile.setFoodPreferences(clean(request.foodPreferences()));
    }

    private List<String> clean(List<String> values) {
        return values == null ? List.of()
                : values.stream()
                        .filter(value -> value != null && !value.isBlank())
                        .map(String::trim)
                        .distinct()
                        .toList();
    }

    private void deactivateOthers(Long userId, Long keepId) {
        List<PersonProfile> others = profiles.findByUserIdOrderByIdAsc(userId).stream()
                .filter(profile -> !profile.getId().equals(keepId) && profile.isActive())
                .toList();
        others.forEach(profile -> profile.setActive(false));
        profiles.saveAll(others);
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}
