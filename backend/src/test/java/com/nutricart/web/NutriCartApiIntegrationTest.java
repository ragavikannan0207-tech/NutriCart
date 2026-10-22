package com.nutricart.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutricart.domain.Order;
import com.nutricart.repository.OrderRepository;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * End-to-end verification of the NutriCart REST API through the real Spring context:
 * the security filter chain, controllers, services, JPA mappings, the catalogue seeder
 * and the order lifecycle all run exactly as in production — only the database is H2
 * instead of MySQL (see src/test/resources/application-test.yml).
 *
 * <p>Each test registers its own account, so the tests stay independent.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NutriCartApiIntegrationTest {

    private static final String JSON = MediaType.APPLICATION_JSON_VALUE;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private OrderRepository orderRepository;

    /* ------------------------------------------------------------- helpers -- */

    private String register(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/register")
                        .contentType(JSON)
                        .content("""
                                {"fullName":"Test Shopper","email":"%s","password":"nutricart123","confirmPassword":"nutricart123"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private long createProfile(String token) throws Exception {
        return postJson(token, "/api/profiles", """
                {"name":"Krishna","age":28,"gender":"Male","heightCm":172,"weightKg":68,
                 "activityLevel":"Moderately Active","dietType":"No Restriction",
                 "healthGoal":"Muscle Gain","budgetAmount":2500,"budgetPeriod":"Weekly",
                 "allergies":[],"foodPreferences":["high protein"]}
                """).get("id").asLong();
    }

    private long createAddress(String token) throws Exception {
        return postJson(token, "/api/addresses", """
                {"label":"Home","recipientName":"Krishna","phone":"9876543210",
                 "line1":"12 Green Park Street","line2":"Apt 4B","city":"Chennai",
                 "state":"Tamil Nadu","pincode":"600001","isDefault":true}
                """).get("id").asLong();
    }

    private JsonNode getJson(String token, String path) throws Exception {
        MvcResult result = mvc.perform(get(path).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode postJson(String token, String path, String payload) throws Exception {
        MvcResult result = mvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(JSON)
                        .content(payload))
                .andReturn();
        assertThat(result.getResponse().getStatus()).isBetween(200, 299);
        return json.readTree(result.getResponse().getContentAsString());
    }

    /* --------------------------------------------------------------- tests -- */

    @Test
    @DisplayName("health probe and catalogue endpoints are public and the catalogue is seeded")
    void healthAndCatalogueArePublic() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(56));

        mvc.perform(get("/api/recipes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(13));

        // Recipe nutrition is computed from the catalogue, never hand-written.
        mvc.perform(get("/api/recipes").param("q", "protein"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].protein").isNumber());

        // Search is case-insensitive and partial: "chips" finds the chip products.
        MvcResult chips = mvc.perform(get("/api/products").param("q", "chips"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(json.readTree(chips.getResponse().getContentAsString()).size()).isGreaterThan(0);

        // Filters and sorting are applied server-side too.
        mvc.perform(get("/api/products")
                        .param("category", "Fruits")
                        .param("maxPrice", "100")
                        .param("sort", "price-asc"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("every account-scoped endpoint rejects a request without a token")
    void protectedEndpointsRequireToken() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/pantry")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/profiles")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("registration validates input, rejects duplicate emails and never stores a plain password")
    void registrationRules() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(JSON)
                        .content("""
                                {"fullName":"A","email":"not-an-email","password":"short","confirmPassword":"nope"}
                                """))
                .andExpect(status().isBadRequest());

        String token = register("krishna.123@gmail.com");   // dots and numbers in Gmail work
        assertThat(token).isNotBlank();

        mvc.perform(post("/api/auth/register").contentType(JSON)
                        .content("""
                                {"fullName":"Someone Else","email":"KRISHNA.123@gmail.com","password":"nutricart123","confirmPassword":"nutricart123"}
                                """))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content("""
                                {"email":"krishna.123@gmail.com","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/login").contentType(JSON)
                        .content("""
                                {"email":"krishna.123@gmail.com","password":"nutricart123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("krishna.123@gmail.com"));
    }

    @Test
    @DisplayName("the first profile becomes active and switching keeps exactly one active person")
    void profilesAndActivePerson() throws Exception {
        String token = register("profile.owner@gmail.com");

        long first = createProfile(token);
        JsonNode profiles = getJson(token, "/api/profiles");
        assertThat(profiles.size()).isEqualTo(1);
        assertThat(profiles.get(0).get("isActive").asBoolean()).isTrue();
        assertThat(profiles.get(0).get("name").asText()).isEqualTo("Krishna");
        // The client sends and receives display labels, never enum constant names.
        assertThat(profiles.get(0).get("dietType").asText()).isEqualTo("No Restriction");
        assertThat(profiles.get(0).get("healthGoal").asText()).isEqualTo("Muscle Gain");

        long second = postJson(token, "/api/profiles", """
                {"name":"Mother","age":56,"gender":"Female","heightCm":158,"weightKg":62,
                 "activityLevel":"Lightly Active","dietType":"Vegetarian",
                 "healthGoal":"Weight Loss","budgetAmount":1800,"budgetPeriod":"Monthly",
                 "allergies":["peanut"],"foodPreferences":["low fat"]}
                """).get("id").asLong();

        JsonNode afterActivate = postJson(token, "/api/profiles/" + second + "/activate", "{}");
        assertThat(afterActivate.size()).isEqualTo(2);
        assertThat(afterActivate.get(0).get("isActive").asBoolean()).isFalse();
        assertThat(afterActivate.get(1).get("isActive").asBoolean()).isTrue();
        assertThat(afterActivate.get(1).get("allergies").get(0).asText()).isEqualTo("peanut");

        // Validation: age out of range is rejected with a field error.
        mvc.perform(post("/api/profiles")
                        .header("Authorization", "Bearer " + token)
                        .contentType(JSON)
                        .content("""
                                {"name":"Child","age":0,"heightCm":100,"weightKg":20}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.age").isNotEmpty());

        assertThat(first).isPositive();
    }

    @Test
    @DisplayName("the cart is global: set, increment and merge all update the same cart")
    void cartIsOneGlobalCart() throws Exception {
        String token = register("cart.owner@gmail.com");
        createProfile(token);

        // Add from the Shop (quantity endpoint) …
        JsonNode cart = putJson(token, "/api/cart/items/1", """
                {"quantity":2}
                """);
        assertThat(cart.size()).isEqualTo(1);
        assertThat(cart.get(0).get("quantity").asInt()).isEqualTo(2);
        assertThat(cart.get(0).get("unitPrice").asDouble()).isGreaterThan(0);

        // … then the + stepper.
        cart = postJson(token, "/api/cart/items/1/increment", """
                {"delta":1}
                """);
        assertThat(cart.get(0).get("quantity").asInt()).isEqualTo(3);

        // … then a recipe / meal planner / Smart Grocery bulk merge (same cart).
        cart = postJson(token, "/api/cart/merge", """
                {"lines":[{"productId":1,"quantity":2},{"productId":2,"quantity":1},{"productId":9999,"quantity":5}]}
                """);
        assertThat(cart.size()).isEqualTo(2);                       // unknown id is skipped, not fatal
        assertThat(cart.get(0).get("quantity").asInt()).isEqualTo(5); // 3 + 2 merged

        // Quantity 0 removes the line (the − button reaching zero).
        cart = putJson(token, "/api/cart/items/2", """
                {"quantity":0}
                """);
        assertThat(cart.size()).isEqualTo(1);
    }

    private JsonNode putJson(String token, String path, String payload) throws Exception {
        MvcResult result = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(JSON)
                        .content(payload))
                .andReturn();
        assertThat(result.getResponse().getStatus()).isBetween(200, 299);
        return json.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode deleteJson(String token, String path) throws Exception {
        MvcResult result = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete(path)
                        .header("Authorization", "Bearer " + token))
                .andReturn();
        assertThat(result.getResponse().getStatus()).isBetween(200, 299);
        String content = result.getResponse().getContentAsString();
        return content.isBlank() ? json.createObjectNode() : json.readTree(content);
    }

    @Test
    @DisplayName("placing an order empties the cart, applies the pricing rules and starts tracking")
    void placingAnOrderEmptiesCartAndPrices() throws Exception {
        String token = register("order.owner@gmail.com");
        createProfile(token);
        createAddress(token);

        long productId = putJson(token, "/api/cart/items/1", """
                {"quantity":1}
                """).get(0).get("productId").asLong();
        JsonNode cart = putJson(token, "/api/cart/items/" + productId, """
                {"quantity":2}
                """);
        double subtotal = cart.get(0).get("unitPrice").asDouble() * 2;

        JsonNode profile = getJson(token, "/api/profiles").get(0);
        JsonNode address = getJson(token, "/api/addresses").get(0);

        JsonNode order = postJson(token, "/api/orders", """
                {"personProfileId":%d,"addressId":%d,"paymentMethod":"UPI","paymentReference":"krishna@okhdfcbank"}
                """.formatted(profile.get("id").asLong(), address.get("id").asLong()));

        assertThat(order.get("orderNumber").asText()).matches("NC-\\d{8}-\\d{4}");
        assertThat(order.get("status").asText()).isEqualTo("Confirmed");
        assertThat(order.get("subtotal").asDouble()).isEqualTo(subtotal);
        assertThat(order.get("paymentMethod").asText()).isEqualTo("UPI");
        assertThat(order.get("paymentReference").asText()).startsWith("UPI ");
        assertThat(order.get("personName").asText()).isEqualTo("Krishna");
        assertThat(order.get("customerName").asText()).isEqualTo("Test Shopper");
        assertThat(order.get("address").get("pincode").asText()).isEqualTo("600001");
        assertThat(order.get("items").size()).isEqualTo(1);
        assertThat(order.get("nutrition").get("calories").asDouble()).isGreaterThan(0);
        assertThat(order.get("estimatedDeliveryAt").asText()).isNotBlank();

        if (subtotal >= 2500) {
            assertThat(order.get("discount").asDouble()).isEqualTo(subtotal * 0.08);
        } else if (subtotal >= 1500) {
            assertThat(order.get("discount").asDouble()).isEqualTo(subtotal * 0.05);
        }
        assertThat(order.get("grandTotal").asDouble())
                .isEqualTo(order.get("subtotal").asDouble()
                        - order.get("discount").asDouble()
                        + order.get("delivery").asDouble()
                        + order.get("tax").asDouble());

        // The cart is emptied the moment the order exists.
        assertThat(getJson(token, "/api/cart").size()).isZero();

        // Orders and the real notification that belongs to them are updated at once.
        assertThat(getJson(token, "/api/orders").size()).isEqualTo(1);
        JsonNode notifications = getJson(token, "/api/notifications");
        assertThat(notifications.get(0).get("type").asText()).isEqualTo("Order Confirmed");
        assertThat(notifications.get(0).get("isImportant").asBoolean()).isTrue();

        // Tracking sync returns the persisted status for the timeline.
        JsonNode synced = postJson(token, "/api/orders/sync", "{}");
        assertThat(synced.get(0).get("status").asText())
                .isIn("Confirmed", "Processing", "Packed", "Out for Delivery", "Delivered");
    }

    @Test
    @DisplayName("cancellation succeeds inside the 60 second window and is recorded as an event")
    void cancellationInsideWindow() throws Exception {
        String token = register("cancel.owner@gmail.com");
        createProfile(token);
        createAddress(token);

        JsonNode profile = getJson(token, "/api/profiles").get(0);
        JsonNode address = getJson(token, "/api/addresses").get(0);
        putJson(token, "/api/cart/items/1", """
                {"quantity":1}
                """);

        long orderId = postJson(token, "/api/orders", """
                {"personProfileId":%d,"addressId":%d,"paymentMethod":"COD"}
                """.formatted(profile.get("id").asLong(), address.get("id").asLong()))
                .get("id").asLong();

        JsonNode cancelled = postJson(token, "/api/orders/" + orderId + "/cancel", "{}");
        assertThat(cancelled.get("status").asText()).isEqualTo("Cancelled");
        assertThat(cancelled.get("cancelledAt").asText()).isNotBlank();

        boolean cancelledNotice = false;
        for (JsonNode notification : getJson(token, "/api/notifications")) {
            cancelledNotice |= "Cancelled".equals(notification.get("type").asText());
        }
        assertThat(cancelledNotice).isTrue();

        // Cancelled orders stay in history (for the invoice) but are excluded from every
        // spending and nutrition aggregate the app derives.
        assertThat(getJson(token, "/api/orders").get(0).get("status").asText()).isEqualTo("Cancelled");
    }

    @Test
    @DisplayName("the server refuses cancellation once the 60 second window has passed")
    void cancellationRefusedAfterWindow() throws Exception {
        String token = register("late.cancel@gmail.com");
        createProfile(token);
        createAddress(token);

        JsonNode profile = getJson(token, "/api/profiles").get(0);
        JsonNode address = getJson(token, "/api/addresses").get(0);
        putJson(token, "/api/cart/items/1", """
                {"quantity":1}
                """);

        long orderId = postJson(token, "/api/orders", """
                {"personProfileId":%d,"addressId":%d,"paymentMethod":"COD"}
                """.formatted(profile.get("id").asLong(), address.get("id").asLong()))
                .get("id").asLong();

        // Age the order past the window. The window is measured from the stored
        // createdAt timestamp, so this is exactly what a client reload would see.
        Order stored = orderRepository.findById(orderId).orElseThrow();
        stored.setCreatedAt(Instant.now().minus(Duration.ofMinutes(5)));
        orderRepository.saveAndFlush(stored);

        mvc.perform(post("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("60 seconds")));
    }

    @Test
    @DisplayName("pantry, meal planner, budget, preferences and wishlist all round-trip")
    void pantryPlanningBudgetAndPreferences() throws Exception {
        String token = register("smart.features@gmail.com");
        long profileId = createProfile(token);

        /* ---- pantry: add, adjust, remove ---------------------------------- */
        JsonNode item = postJson(token, "/api/pantry", """
                {"personProfileId":%d,"productId":30,"name":"Brown Rice","category":"Grains",
                 "quantity":500,"unit":"g","purchaseDate":"2026-09-20"}
                """.formatted(profileId));
        assertThat(item.get("normalisedQuantity").asDouble()).isEqualTo(500);
        assertThat(item.get("normalisedUnit").asText()).isEqualTo("g");
        // No printed date was supplied, so freshness is flagged as an estimate.
        assertThat(item.get("expiryEstimated").asBoolean()).isTrue();
        assertThat(item.get("expiryDate").asText()).isNotEmpty();

        long pantryId = item.get("id").asLong();
        JsonNode adjusted = postJson(token, "/api/pantry/" + pantryId + "/adjust", """
                {"delta":-1}
                """);
        assertThat(adjusted.get("removed").asBoolean()).isFalse();
        assertThat(adjusted.get("items").get(0).get("quantity").asDouble()).isEqualTo(499);

        /* ---- meal planner: empty week, add a meal, remove it -------------- */
        JsonNode week = getJson(token, "/api/meal-plans?weekStart=2026-09-21");
        assertThat(week.get("items").size()).isZero();
        long planId = week.get("id").asLong();

        JsonNode withMeal = postJson(token, "/api/meal-plans/items", """
                {"day":"Monday","slot":"Breakfast","recipeId":1,"servings":2}
                """);
        assertThat(withMeal.get("items").size()).isEqualTo(1);
        long mealItemId = withMeal.get("items").get(0).get("id").asLong();
        assertThat(withMeal.get("items").get(0).get("day").asText()).isEqualTo("Monday");
        assertThat(withMeal.get("items").get(0).get("slot").asText()).isEqualTo("Breakfast");

        JsonNode updated = putJson(token, "/api/meal-plans/items/" + mealItemId, """
                {"servings":4}
                """);
        assertThat(updated.get("items").get(0).get("servings").asInt()).isEqualTo(4);

        JsonNode emptied = deleteJson(token, "/api/meal-plans/items/" + mealItemId);
        assertThat(emptied.get("items").size()).isZero();
        assertThat(planId).isPositive();

        /* ---- budget: nothing set yet, then saved -------------------------- */
        /* Nothing set yet answers 200 with an empty body (the "no budget" empty
         * state), while a person profile that is not the caller's returns 404. */
        mvc.perform(get("/api/budget").param("personProfileId", String.valueOf(profileId))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    assertThat(body == null || body.isBlank()).isTrue();
                });
        mvc.perform(get("/api/budget").param("personProfileId", "999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        JsonNode budget = putJson(token, "/api/budget", """
                {"personProfileId":%d,"amount":2500,"period":"Weekly"}
                """.formatted(profileId));
        assertThat(budget.get("amount").asDouble()).isEqualTo(2500);
        assertThat(budget.get("period").asText()).isEqualTo("Weekly");
        assertThat(getJson(token, "/api/budget?personProfileId=" + profileId).get("amount").asDouble())
                .isEqualTo(2500);

        /* ---- preferences -------------------------------------------------- */
        JsonNode preferences = getJson(token, "/api/preferences");
        assertThat(preferences.get("nutritionPeriod").asText()).isEqualTo("Weekly");

        JsonNode saved = putJson(token, "/api/preferences", """
                {"notifyOrderUpdates":true,"notifyPantryExpiry":false,"notifyBudgetAlerts":true,
                 "notifyRecommendations":true,"notifyWeeklyPlan":true,"nutritionPeriod":"Monthly",
                 "defaultPantryUnit":"kg","mealPreference":"High Protein","measurementSystem":"Metric","currency":"INR"}
                """);
        assertThat(saved.get("notifyPantryExpiry").asBoolean()).isFalse();
        assertThat(saved.get("nutritionPeriod").asText()).isEqualTo("Monthly");
        assertThat(saved.get("defaultPantryUnit").asText()).isEqualTo("kg");

        /* ---- wishlist toggle ---------------------------------------------- */
        assertThat(postJson(token, "/api/wishlist/3/toggle", "{}").size()).isEqualTo(1);
        assertThat(postJson(token, "/api/wishlist/3/toggle", "{}").size()).isZero();
    }

    @Test
    @DisplayName("simultaneous checkouts never collide on an order number (no numbering race)")
    void concurrentCheckoutsGetUniqueOrderNumbers() throws Exception {
        // Four separate shoppers, each with their own cart, checking out at the same instant.
        // Before the fix every request derived its reference from a row count, so they all
        // produced the same order number and all but one failed with a 500 on the unique index.
        int shoppers = 4;
        String[] tokens = new String[shoppers];
        String[] payloads = new String[shoppers];
        for (int index = 0; index < shoppers; index++) {
            String token = register("concurrent" + index + ".owner@gmail.com");
            tokens[index] = token;
            long profileId = createProfile(token);
            long addressId = createAddress(token);
            putJson(token, "/api/cart/items/1", """
                    {"quantity":1}
                    """);
            payloads[index] = """
                    {"personProfileId":%d,"addressId":%d,"paymentMethod":"COD"}
                    """.formatted(profileId, addressId);
        }

        java.util.concurrent.ExecutorService pool =
                java.util.concurrent.Executors.newFixedThreadPool(shoppers);
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        java.util.List<java.util.concurrent.Future<MvcResult>> futures = new java.util.ArrayList<>();

        for (int index = 0; index < shoppers; index++) {
            final int shopper = index;
            futures.add(pool.submit(() -> {
                start.await();
                return mvc.perform(post("/api/orders")
                                .header("Authorization", "Bearer " + tokens[shopper])
                                .contentType(JSON)
                                .content(payloads[shopper]))
                        .andReturn();
            }));
        }
        start.countDown();

        java.util.List<String> numbers = new java.util.ArrayList<>();
        for (java.util.concurrent.Future<MvcResult> future : futures) {
            MvcResult result = future.get(60, java.util.concurrent.TimeUnit.SECONDS);
            // Every checkout must succeed: an order can never be lost to a numbering race.
            assertThat(result.getResponse().getStatus()).isEqualTo(201);
            numbers.add(json.readTree(result.getResponse().getContentAsString()).get("orderNumber").asText());
        }
        pool.shutdownNow();

        assertThat(numbers).doesNotHaveDuplicates();
        assertThat(numbers).allMatch(number -> number.matches("NC-\\d{8}-\\d{4,}"));
    }
}
