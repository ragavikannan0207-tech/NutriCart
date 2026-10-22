package com.nutricart.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ZzProbeMergeTest {

    private static final String JSON = MediaType.APPLICATION_JSON_VALUE;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Test
    @DisplayName("probe: merge with a duplicated product id")
    void mergeWithDuplicateProductId() throws Exception {
        MvcResult reg = mvc.perform(post("/api/auth/register")
                        .contentType(JSON)
                        .content("""
                                {"fullName":"Probe","email":"probe.dupe@gmail.com","password":"nutricart123","confirmPassword":"nutricart123"}
                                """))
                .andReturn();
        String token = json.readTree(reg.getResponse().getContentAsString()).get("token").asText();

        MvcResult result = mvc.perform(post("/api/cart/merge")
                        .header("Authorization", "Bearer " + token)
                        .contentType(JSON)
                        .content("""
                                {"lines":[{"productId":1,"quantity":2},{"productId":1,"quantity":3}]}
                                """))
                .andReturn();

        System.out.println("PROBE STATUS: " + result.getResponse().getStatus());
        System.out.println("PROBE BODY: " + result.getResponse().getContentAsString());
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        assertThat(body.isArray()).isTrue();
    }
}
