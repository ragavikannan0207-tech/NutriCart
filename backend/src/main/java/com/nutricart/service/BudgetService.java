package com.nutricart.service;

import com.nutricart.domain.Budget;
import com.nutricart.domain.Order;
import com.nutricart.domain.PersonProfile;
import com.nutricart.domain.UserAccount;
import com.nutricart.domain.enums.BudgetPeriod;
import com.nutricart.domain.enums.NotificationType;
import com.nutricart.domain.enums.OrderStatus;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.BudgetRepository;
import com.nutricart.repository.OrderRepository;
import com.nutricart.repository.UserAccountRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grocery budgets, one per person profile.
 *
 * <p>The amount is a user setting; the spend is always derived from real,
 * non-cancelled orders inside the selected period, so no figure on the Budget page
 * can be invented. A genuine "Budget Warning" notification is raised the moment an
 * order pushes the period spend past the limit.
 */
@Service
public class BudgetService {

    private final BudgetRepository budgets;
    private final OrderRepository orders;
    private final ProfileService profileService;
    private final NotificationService notificationService;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public BudgetService(
            BudgetRepository budgets,
            OrderRepository orders,
            ProfileService profileService,
            NotificationService notificationService,
            UserAccountRepository users,
            DtoMapper mapper) {
        this.budgets = budgets;
        this.orders = orders;
        this.profileService = profileService;
        this.notificationService = notificationService;
        this.users = users;
        this.mapper = mapper;
    }

    /**
     * The saved budget for a person, or null when nothing has been set yet.
     * A person profile that does not belong to this account (or no longer exists)
     * still fails with 404 — ownership is validated explicitly, not by coincidence.
     */
    @Transactional(readOnly = true)
    public ShoppingDtos.BudgetDto get(Long userId, Long personProfileId) {
        Long personId = resolvePerson(userId, personProfileId);
        profileService.require(userId, personId);
        return budgets.findByUserIdAndPersonProfileId(userId, personId)
                .map(mapper::budget)
                .orElse(null);
    }

    @Transactional
    public ShoppingDtos.BudgetDto save(Long userId, ShoppingDtos.BudgetRequest request) {
        Long personId = resolvePerson(userId, request.personProfileId());
        profileService.require(userId, personId);

        double amount = request.amount() == null ? 0 : request.amount();
        if (amount < 0) {
            throw ApiException.field("amount", "A budget cannot be negative.");
        }
        BudgetPeriod period = EnumParsing.budgetPeriod("period", request.period());

        Budget budget = budgets.findByUserIdAndPersonProfileId(userId, personId).orElseGet(() -> {
            Budget created = new Budget();
            created.setUser(requireUser(userId));
            created.setPersonProfileId(personId);
            return created;
        });
        budget.setAmount(amount);
        budget.setPeriod(period);
        budget.setUpdatedAt(Instant.now());
        return mapper.budget(budgets.save(budget));
    }

    /**
     * Called right after an order is placed. Compares the period spend with the saved
     * budget and raises a warning notification at most once per person per day, so the
     * bell menu never fills with duplicates.
     */
    @Transactional
    public void warnIfOverBudget(Long userId, PersonProfile person) {
        Budget budget = budgets.findByUserIdAndPersonProfileId(userId, person.getId()).orElse(null);
        if (budget == null || budget.getAmount() <= 0) {
            return;
        }
        if (spendFor(userId, person.getId(), budget.getPeriod()) <= budget.getAmount()) {
            return;
        }
        String today = LocalDate.now().toString();
        boolean warnedToday = notificationService.list(userId).stream().anyMatch(existing ->
                existing.type() != null
                        && existing.type().equals(NotificationType.BUDGET_WARNING.label())
                        && person.getId().equals(existing.personProfileId())
                        && existing.createdAt() != null
                        && existing.createdAt().toString().startsWith(today));
        if (warnedToday) {
            return;
        }
        notificationService.push(userId, new NotificationService.Draft(
                NotificationType.BUDGET_WARNING,
                person.getName() + "'s " + budget.getPeriod().label().toLowerCase() + " budget is exceeded",
                "Orders in this period total more than the budget you set.",
                "/budget",
                person.getId(),
                true));
    }

    /** Total of real, non-cancelled orders for a person inside their budget period. */
    @Transactional(readOnly = true)
    public double spendFor(Long userId, Long personProfileId, BudgetPeriod period) {
        LocalDate start = LocalDate.now().minusDays(period.days() - 1L);
        List<Order> relevant = orders.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(order -> personProfileId.equals(order.personId()))
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .filter(order -> !order.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isBefore(start))
                .toList();
        return round(relevant.stream().mapToDouble(Order::getGrandTotal).sum());
    }

    private Long resolvePerson(Long userId, Long personProfileId) {
        if (personProfileId != null) {
            return personProfileId;
        }
        PersonProfile active = profileService.activeProfile(userId);
        if (active == null) {
            throw ApiException.field("personProfileId", "Create a person profile before setting a budget.");
        }
        return active.getId();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}
