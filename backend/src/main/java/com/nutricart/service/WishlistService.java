package com.nutricart.service;

import com.nutricart.domain.Product;
import com.nutricart.domain.WishlistItem;
import com.nutricart.dto.ShoppingDtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.UserAccountRepository;
import com.nutricart.repository.WishlistItemRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The global wishlist. Persisted per account, and adding a wishlist product to the
 * cart always goes through the same {@link CartService} as every other page.
 */
@Service
public class WishlistService {

    private final WishlistItemRepository wishlist;
    private final CatalogueService catalogue;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public WishlistService(
            WishlistItemRepository wishlist,
            CatalogueService catalogue,
            UserAccountRepository users,
            DtoMapper mapper) {
        this.wishlist = wishlist;
        this.catalogue = catalogue;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ShoppingDtos.WishlistItemDto> list(Long userId) {
        return wishlist.findByUserIdOrderByAddedAtDesc(userId).stream().map(mapper::wishlistItem).toList();
    }

    @Transactional
    public List<ShoppingDtos.WishlistItemDto> add(Long userId, Long productId) {
        Product product = catalogue.requireProduct(productId);
        if (!wishlist.existsByUserIdAndProductId(userId, product.getId())) {
            WishlistItem item = new WishlistItem();
            item.setUser(users.findById(userId)
                    .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again.")));
            item.setProduct(product);
            item.setAddedAt(Instant.now());
            wishlist.save(item);
        }
        return list(userId);
    }

    @Transactional
    public List<ShoppingDtos.WishlistItemDto> remove(Long userId, Long productId) {
        wishlist.deleteByUserIdAndProductId(userId, productId);
        return list(userId);
    }

    /** Heart button behaviour: save when absent, remove when already saved. */
    @Transactional
    public List<ShoppingDtos.WishlistItemDto> toggle(Long userId, Long productId) {
        if (wishlist.existsByUserIdAndProductId(userId, productId)) {
            return remove(userId, productId);
        }
        return add(userId, productId);
    }
}