package com.nutricart.service;

import com.nutricart.domain.CartItem;
import com.nutricart.domain.Product;
import com.nutricart.domain.UserAccount;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.CartItemRepository;
import com.nutricart.repository.UserAccountRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The ONE global cart.
 *
 * <p>Products added from the Shop, Product Details, Wishlist, Recipes, Pantry,
 * Meal Planner, Smart Grocery, For You or Healthy Alternatives all land here, which
 * is why every surface of the app shares a single cart and a single order flow.
 */
@Service
public class CartService {

    private static final int MAX_QUANTITY_PER_LINE = 50;

    private final CartItemRepository cart;
    private final CatalogueService catalogue;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public CartService(
            CartItemRepository cart,
            CatalogueService catalogue,
            UserAccountRepository users,
            DtoMapper mapper) {
        this.cart = cart;
        this.catalogue = catalogue;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ShoppingDtos.CartLineDto> get(Long userId) {
        return cart.findByUserIdOrderByAddedAtAsc(userId).stream().map(mapper::cartLine).toList();
    }

    /** Sets an exact quantity; 0 removes the line. */
    @Transactional
    public List<ShoppingDtos.CartLineDto> setQuantity(Long userId, Long productId, Integer quantity) {
        int wanted = quantity == null ? 0 : quantity;
        if (wanted < 0) {
            throw ApiException.field("quantity", "Quantity cannot be negative.");
        }
        if (wanted == 0) {
            cart.deleteByUserIdAndProductId(userId, productId);
            return get(userId);
        }

        Product product = catalogue.requireProduct(productId);
        if (product.getStockCount() <= 0) {
            throw ApiException.badRequest(product.getName() + " is out of stock right now.");
        }
        if (wanted > MAX_QUANTITY_PER_LINE) {
            throw ApiException.field("quantity", "You can order up to " + MAX_QUANTITY_PER_LINE + " of one product.");
        }

        CartItem line = cart.findByUserIdAndProductId(userId, productId).orElseGet(() -> {
            CartItem created = new CartItem();
            created.setUser(requireUser(userId));
            created.setProduct(product);
            created.setAddedAt(Instant.now());
            return created;
        });
        line.setQuantity(wanted);
        line.setUnitPrice(product.getPrice());
        cart.save(line);
        return get(userId);
    }

    /** Used by the − / + stepper on product cards and in the cart. */
    @Transactional
    public List<ShoppingDtos.CartLineDto> increment(Long userId, Long productId, Integer delta) {
        int change = delta == null ? 0 : delta;
        int current = cart.findByUserIdAndProductId(userId, productId)
                .map(CartItem::getQuantity)
                .orElse(0);
        return setQuantity(userId, productId, Math.max(0, current + change));
    }

    @Transactional
    public List<ShoppingDtos.CartLineDto> remove(Long userId, Long productId) {
        cart.deleteByUserIdAndProductId(userId, productId);
        return get(userId);
    }

    @Transactional
    public void clear(Long userId) {
        cart.deleteByUserId(userId);
    }

    /**
     * Merges lines into the cart (Wishlist, Recipe ingredients, meal planner weekly
     * list, Smart Grocery basket). Duplicates are added to the existing quantity.
     *
     * <p>The incoming lines are aggregated by product id <em>before</em> anything is
     * written. A request can legitimately mention the same product twice (a basket
     * that lists an item in two aisles, or a weekly list where an ingredient shows
     * up in two meals). The cart table keeps one row per user + product, so saving
     * two rows for the same product would violate that uniqueness and fail the whole
     * request with a 500. Aggregating first keeps the merge idempotent: the same
     * product always ends up as a single cart line holding the summed quantity.
     */
    @Transactional
    public List<ShoppingDtos.CartLineDto> merge(Long userId, List<ShoppingDtos.CartLineDto> lines) {
        if (lines == null || lines.isEmpty()) {
            return get(userId);
        }
        UserAccount account = requireUser(userId);

        // One entry per product, keeping the order the products were sent in.
        Map<Long, Integer> requested = new LinkedHashMap<>();
        for (ShoppingDtos.CartLineDto line : lines) {
            if (line == null || line.productId() == null || line.quantity() <= 0) {
                continue;
            }
            requested.merge(line.productId(), line.quantity(), Integer::sum);
        }

        List<CartItem> touched = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : requested.entrySet()) {
            Product product = catalogue.findProduct(entry.getKey());
            if (product == null || product.getStockCount() <= 0) {
                continue; // unavailable products are skipped rather than failing the whole add
            }
            int incoming = entry.getValue();
            CartItem item = cart.findByUserIdAndProductId(userId, product.getId()).orElseGet(() -> {
                CartItem created = new CartItem();
                created.setUser(account);
                created.setProduct(product);
                created.setAddedAt(Instant.now());
                return created;
            });
            int quantity = Math.min(MAX_QUANTITY_PER_LINE, item.getQuantity() + incoming);
            item.setQuantity(quantity);
            item.setUnitPrice(product.getPrice());
            touched.add(item);
        }
        cart.saveAll(touched);
        return get(userId);
    }

    /** Cart lines as entities, used when placing an order. */
    @Transactional(readOnly = true)
    public List<CartItem> lines(Long userId) {
        return cart.findByUserIdOrderByAddedAtAsc(userId);
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}