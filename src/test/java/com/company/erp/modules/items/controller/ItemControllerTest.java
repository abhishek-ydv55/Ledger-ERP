package com.company.erp.modules.items.controller;

import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.modules.items.dto.ItemRequest;
import com.company.erp.modules.items.dto.ItemResponse;
import com.company.erp.modules.items.service.ItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ItemController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
})
@AutoConfigureMockMvc(addFilters = false)
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ItemService itemService;

    private final UUID tenantId = UUID.fromString("123e4567-e89b-12d3-a456-426614174000");
    private final UUID itemId = UUID.fromString("987e6543-e89b-12d3-a456-426614174999");

    @Nested
    @DisplayName("POST /api/v1/items - Create Item")
    class CreateItemTests {

        @Test
        @DisplayName("Should create item successfully with valid payload")
        void createItem_Success() throws Exception {
            ItemRequest request = new ItemRequest(
                    "Industrial Drill",
                    "SKU-DRILL-001",
                    "Heavy duty cordless drill",
                    new BigDecimal("150.00"),
                    new BigDecimal("50.00"),
                    "PCS",
                    null, null, null, true
            );

            ItemResponse response = new ItemResponse(
                    itemId,
                    tenantId,
                    "Industrial Drill",
                    "SKU-DRILL-001",
                    "Heavy duty cordless drill",
                    new BigDecimal("150.00"),
                    new BigDecimal("50.00"),
                    "PCS",
                    true,
                    null, null, null,
                    Instant.now(),
                    Instant.now()
            );

            given(itemService.createItem(any(ItemRequest.class))).willReturn(response);

            mockMvc.perform(post("/api/v1/items")
                            .header("X-Tenant-ID", tenantId.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
                            .with(csrf()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Item created successfully")))
                    .andExpect(jsonPath("$.data.id", is(itemId.toString())))
                    .andExpect(jsonPath("$.data.sku", is("SKU-DRILL-001")))
                    .andExpect(jsonPath("$.data.unitPrice", is(150.00)));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when validation fails")
        void createItem_ValidationError() throws Exception {
            ItemRequest invalidRequest = new ItemRequest(
                    "",
                    "",
                    "Description",
                    new BigDecimal("-10.00"),
                    new BigDecimal("5.00"),
                    "PCS",
                    null, null, null, true
            );

            mockMvc.perform(post("/api/v1/items")
                            .header("X-Tenant-ID", tenantId.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest))
                            .with(csrf()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success", is(false)))
                    .andExpect(jsonPath("$.message", is("Validation failed")))
                    .andExpect(jsonPath("$.errors", hasSize(3)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/items/{id} - Get Item by ID")
    class GetItemByIdTests {

        @Test
        @DisplayName("Should return item details when item exists")
        void getItemById_Success() throws Exception {
            ItemResponse response = new ItemResponse(
                    itemId,
                    tenantId,
                    "Hydraulic Valve",
                    "SKU-VALVE-002",
                    "High pressure valve",
                    new BigDecimal("85.50"),
                    new BigDecimal("120.00"),
                    "PCS",
                    true,
                    null, null, null,
                    Instant.now(),
                    Instant.now()
            );

            given(itemService.getItemById(itemId)).willReturn(response);

            mockMvc.perform(get("/api/v1/items/{id}", itemId)
                            .header("X-Tenant-ID", tenantId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.id", is(itemId.toString())))
                    .andExpect(jsonPath("$.data.name", is("Hydraulic Valve")));
        }

        @Test
        @DisplayName("Should return 404 Not Found when item does not exist")
        void getItemById_NotFound() throws Exception {
            given(itemService.getItemById(itemId))
                    .willThrow(new ResourceNotFoundException("Item", "id", itemId));

            mockMvc.perform(get("/api/v1/items/{id}", itemId)
                            .header("X-Tenant-ID", tenantId.toString()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success", is(false)))
                    .andExpect(jsonPath("$.message", is(String.format("Item not found with id: '%s'", itemId))));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/items - List All Items")
    class GetAllItemsTests {

        @Test
        @DisplayName("Should return list of items for active tenant")
        void getAllItems_Success() throws Exception {
            ItemResponse item1 = new ItemResponse(
                    UUID.randomUUID(), tenantId, "Item A", "SKU-A", "Desc A",
                    new BigDecimal("10.00"), new BigDecimal("100"), "PCS", true, null, null, null, Instant.now(), Instant.now()
            );
            ItemResponse item2 = new ItemResponse(
                    UUID.randomUUID(), tenantId, "Item B", "SKU-B", "Desc B",
                    new BigDecimal("20.00"), new BigDecimal("200"), "PCS", true, null, null, null, Instant.now(), Instant.now()
            );

            given(itemService.getAllItems()).willReturn(List.of(item1, item2));

            mockMvc.perform(get("/api/v1/items")
                            .header("X-Tenant-ID", tenantId.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].name", is("Item A")))
                    .andExpect(jsonPath("$.data[1].name", is("Item B")));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/items/{id} - Update Item")
    class UpdateItemTests {

        @Test
        @DisplayName("Should update item successfully")
        void updateItem_Success() throws Exception {
            ItemRequest updateRequest = new ItemRequest(
                    "Updated Item",
                    "SKU-UPDATED",
                    "Updated description",
                    new BigDecimal("99.99"),
                    new BigDecimal("75.00"),
                    "SET",
                    null, null, null, true
            );

            ItemResponse updatedResponse = new ItemResponse(
                    itemId, tenantId, "Updated Item", "SKU-UPDATED", "Updated description",
                    new BigDecimal("99.99"), new BigDecimal("75.00"), "SET", true, null, null, null, Instant.now(), Instant.now()
            );

            given(itemService.updateItem(eq(itemId), any(ItemRequest.class))).willReturn(updatedResponse);

            mockMvc.perform(put("/api/v1/items/{id}", itemId)
                            .header("X-Tenant-ID", tenantId.toString())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest))
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Item updated successfully")))
                    .andExpect(jsonPath("$.data.name", is("Updated Item")));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/items/{id} - Delete Item")
    class DeleteItemTests {

        @Test
        @DisplayName("Should delete item successfully")
        void deleteItem_Success() throws Exception {
            doNothing().when(itemService).deleteItem(itemId);

            mockMvc.perform(delete("/api/v1/items/{id}", itemId)
                            .header("X-Tenant-ID", tenantId.toString())
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.message", is("Item deleted successfully")));
        }
    }
}
