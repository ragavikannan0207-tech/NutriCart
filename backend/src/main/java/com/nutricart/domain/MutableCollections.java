package com.nutricart.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA collection hygiene.
 *
 * <p>Hibernate mutates every mapped collection it manages: loading an entity swaps
 * the field for a {@code PersistentBag}, and {@code merge} clears the target
 * collection before copying the detached state into it. An immutable list
 * ({@code List.of(...)}, {@code Stream.toList()}) therefore blows up with an
 * {@code UnsupportedOperationException} the first time such an entity is updated.
 *
 * <p>Every collection setter on a NutriCart entity funnels through this helper, so no
 * service can ever pin an immutable list onto a managed entity again.
 */
final class MutableCollections {

    private MutableCollections() {
    }

    /** Returns a mutable, null-safe copy of {@code values}. */
    static <T> List<T> mutableCopyOf(List<T> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
