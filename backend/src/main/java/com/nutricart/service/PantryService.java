package com.nutricart.service;

import com.nutricart.domain.PantryItem;
import com.nutricart.domain.Product;
import com.nutricart.domain.UserAccount;
import com.nutricart.domain.enums.Category;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.PantryItemRepository;
import com.nutricart.repository.UserAccountRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * My Pantry — the real kitchen inventory, deliberately separate from the cart.
 *
 * <p>Packaged goods keep their printed expiry date. Fresh produce has no printed
 * date in this catalogue, so freshness is ESTIMATED from the product type and the
 * purchase date ({@link ShelfLife}) and is flagged as an estimate. Expired items are
 * never deleted automatically — the user decides.
 */
@Service
public class PantryService {

    private final PantryItemRepository pantry;
    private final CatalogueService catalogue;
    private final UserAccountRepository users;
    private final ProfileService profileService;
    private final DtoMapper mapper;

    public PantryService(
            PantryItemRepository pantry,
            CatalogueService catalogue,
            UserAccountRepository users,
            ProfileService profileService,
            DtoMapper mapper) {
        this.pantry = pantry;
        this.catalogue = catalogue;
        this.users = users;
        this.profileService = profileService;
        this.mapper = mapper;
    }

    /** Entire pantry, soonest expiry first; optionally narrowed to one person. */
    @Transactional(readOnly = true)
    public List<ShoppingDtos.PantryItemDto> list(Long userId, Long personProfileId) {
        List<PantryItem> items = personProfileId == null
                ? pantry.findByUserIdOrderByExpiryDateAsc(userId)
                : pantry.findByUserIdAndPersonProfileIdOrderByExpiryDateAsc(userId, personProfileId);
        return items.stream().map(mapper::pantryItem).toList();
    }

    @Transactional
    public ShoppingDtos.PantryItemDto create(Long userId, ShoppingDtos.PantryItemRequest request) {
        UserAccount account = requireUser(userId);
        PantryItem item = new PantryItem();
        item.setUser(account);
        applyRequest(userId, item, request, true);
        return mapper.pantryItem(pantry.save(item));
    }

    @Transactional
    public ShoppingDtos.PantryItemDto update(Long userId, Long id, ShoppingDtos.PantryItemRequest request) {
        PantryItem item = require(userId, id);
        applyRequest(userId, item, request, false);
        return mapper.pantryItem(pantry.save(item));
    }

    @Transactional
    public void remove(Long userId, Long id) {
        pantry.delete(require(userId, id));
    }

    /**
     * − 1 / + 1 from the pantry list. A quantity that reaches zero removes the line;
     * the returned {@code removed} flag tells the React client to refresh its list.
     */
    @Transactional
    public ShoppingDtos.PantryAdjustResponse adjust(Long userId, Long id, Integer delta) {
        PantryItem item = require(userId, id);
        double next = Math.max(0, round(item.getQuantity() + (delta == null ? 0 : delta)));
        if (next == 0) {
            pantry.delete(item);
            return new ShoppingDtos.PantryAdjustResponse(true, list(userId, null));
        }
        UnitNormalizer.Normalised normalised = UnitNormalizer.normalise(next, item.getUnit(), item.getProduct());
        item.setQuantity(next);
        item.setNormalisedQuantity(normalised.quantity());
        item.setNormalisedUnit(normalised.unit());
        pantry.save(item);
        return new ShoppingDtos.PantryAdjustResponse(false, list(userId, null));
    }

    @Transactional(readOnly = true)
    public PantryItem require(Long userId, Long id) {
        return pantry.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("That pantry item no longer exists."));
    }

    private void applyRequest(
            Long userId, PantryItem item, ShoppingDtos.PantryItemRequest request, boolean creating) {
        Long personId = request.personProfileId();
        if (personId == null) {
            var active = profileService.activeProfile(userId);
            if (active == null) {
                throw ApiException.field("personProfileId", "Create a person profile before adding pantry items.");
            }
            personId = active.getId();
        } else {
            profileService.require(userId, personId);
        }

        Product product = request.productId() == null ? null : catalogue.findProduct(request.productId());
        String name = request.name() == null || request.name().isBlank()
                ? (product != null ? product.getName() : "")
                : request.name().trim();
        if (name.isEmpty()) {
            throw ApiException.field("name", "Enter the pantry item name.");
        }

        double quantity = request.quantity() == null ? 0 : request.quantity();
        if (quantity <= 0) {
            throw ApiException.field("quantity", "Enter a quantity greater than zero.");
        }

        String unit = request.unit() == null || request.unit().isBlank()
                ? (product != null ? product.getPackUnit() : "g")
                : request.unit().trim();

        LocalDate purchaseDate = request.purchaseDate() == null ? LocalDate.now() : request.purchaseDate();
        boolean printedDate = request.expiryDate() != null;
        LocalDate expiryDate = printedDate
                ? request.expiryDate()
                : ShelfLife.estimatedExpiry(purchaseDate, product, name);
        boolean estimated = request.expiryEstimated() != null ? request.expiryEstimated() : !printedDate;

        UnitNormalizer.Normalised normalised = UnitNormalizer.normalise(quantity, unit, product);

        item.setPersonProfileId(personId);
        item.setProduct(product);
        item.setName(name);
        item.setCategory(product != null
                ? product.getCategory()
                : (request.category() == null
                        ? Category.EVERYDAY_GROCERIES
                        : EnumParsing.category("category", request.category())));
        item.setQuantity(quantity);
        item.setUnit(unit);
        item.setNormalisedQuantity(normalised.quantity());
        item.setNormalisedUnit(normalised.unit());
        item.setPurchaseDate(purchaseDate);
        item.setExpiryDate(expiryDate);
        item.setExpiryEstimated(estimated);
        item.setNotes(request.notes() == null ? "" : request.notes().trim());
        if (creating) {
            item.setCreatedAt(Instant.now());
        }
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}
