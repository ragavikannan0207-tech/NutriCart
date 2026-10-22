package com.nutricart.security;

import com.nutricart.exception.ApiException;

/**
 * Convenience accessor for the authenticated user id.
 * Authentication is enforced by SecurityConfig, so reaching a controller method
 * means a token was present — this class only reads it and fails safely if not.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static Long id() {
        Object principal = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication() == null
                ? null
                : org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication().getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        throw ApiException.unauthorized("Your session has expired. Please sign in again.");
    }
}