package com.nutricart.web;

import com.nutricart.dto.ShoppingDtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.CartService;
import com.nutricart.service.WishlistService;
import java.util.List;
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
 * The single global cart and wishlist.
 * Every module in NutriCart — Shop, Product Details, Wishlist, Recipes, Pantry,
 * Meal Planner, Smart Grocery, For You and Healthy Alternatives — reaches the cart
 * through these endpoints, which is what keeps it ONE cart.
 */
@RestController
@RequestMapping("/api")
public class CartController {

    private final CartService cartService;
    private final WishlistService wishlistService;

    public CartController(CartService cartService, WishlistService wishlistService) {
        this.cartService = cartService;
        this.wishlistService = wishlistService;
    }

    /* ---------------------------------------------------------------- CART -- */

    @GetMapping("/cart")
    public List<ShoppingDtos.CartLineDto> cart() {
        return cartService.get(CurrentUser.id());
    }

    /** Exact quantity; 0 removes the line (the − button reaching zero). */
    @PutMapping("/cart/items/{productId}")
    public List<ShoppingDtos.CartLineDto> setQuantity(
            @PathVariable Long productId, @RequestBody ShoppingDtos.QuantityRequest request) {
        return cartService.setQuantity(CurrentUser.id(), productId, request.quantity());
    }

    /** The + / − stepper used on product cards and in the cart. */
    @PostMapping("/cart/items/{productId}/increment")
    public List<ShoppingDtos.CartLineDto> increment(
            @PathVariable Long productId, @RequestBody ShoppingDtos.DeltaRequest request) {
        return cartService.increment(CurrentUser.id(), productId, request.delta());
    }

    @DeleteMapping("/cart/items/{productId}")
    public List<ShoppingDtos.CartLineDto> remove(@PathVariable Long productId) {
        return cartService.remove(CurrentUser.id(), productId);
    }

    @DeleteMapping("/cart")
    public ResponseEntity<Void> clear() {
        cartService.clear(CurrentUser.id());
        return ResponseEntity.noContent().build();
    }

    /** Adds many lines at once: recipe ingredients, weekly plan, Smart Grocery basket. */
    @PostMapping("/cart/merge")
    public List<ShoppingDtos.CartLineDto> merge(@RequestBody ShoppingDtos.MergeRequest request) {
        return cartService.merge(CurrentUser.id(), request == null ? List.of() : request.lines());
    }

    /* ------------------------------------------------------------ WISHLIST -- */

    @GetMapping("/wishlist")
    public List<ShoppingDtos.WishlistItemDto> wishlist() {
        return wishlistService.list(CurrentUser.id());
    }

    @PostMapping("/wishlist/{productId}")
    public List<ShoppingDtos.WishlistItemDto> addToWishlist(@PathVariable Long productId) {
        return wishlistService.add(CurrentUser.id(), productId);
    }

    @DeleteMapping("/wishlist/{productId}")
    public List<ShoppingDtos.WishlistItemDto> removeFromWishlist(@PathVariable Long productId) {
        return wishlistService.remove(CurrentUser.id(), productId);
    }

    @PostMapping("/wishlist/{productId}/toggle")
    public List<ShoppingDtos.WishlistItemDto> toggleWishlist(@PathVariable Long productId) {
        return wishlistService.toggle(CurrentUser.id(), productId);
    }
}