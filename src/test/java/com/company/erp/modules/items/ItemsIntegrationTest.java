package com.company.erp.modules.items;

import com.company.erp.common.domain.TenantScopedEntity;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.dto.ItemCategoryRequest;
import com.company.erp.modules.items.dto.ItemCategoryResponse;
import com.company.erp.modules.items.dto.ItemRequest;
import com.company.erp.modules.items.dto.TaxRateRequest;
import com.company.erp.modules.items.dto.TaxRateResponse;
import com.company.erp.modules.items.dto.UnitRequest;
import com.company.erp.modules.items.dto.UnitResponse;
import com.company.erp.modules.items.service.ItemCategoryService;
import com.company.erp.modules.items.service.TaxRateService;
import com.company.erp.modules.items.service.UnitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
public class ItemsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ItemCategoryService categoryService;

    @Autowired
    private UnitService unitService;

    @Autowired
    private TaxRateService taxRateService;

    private final UUID tenant1 = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID tenant2 = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM refresh_tokens");
        jdbcTemplate.execute("DELETE FROM party_contacts");
        jdbcTemplate.execute("DELETE FROM party_addresses");
        jdbcTemplate.execute("DELETE FROM party_roles");
        jdbcTemplate.execute("DELETE FROM parties");
        jdbcTemplate.execute("DELETE FROM items");
        jdbcTemplate.execute("DELETE FROM item_categories");
        jdbcTemplate.execute("DELETE FROM units");
        jdbcTemplate.execute("DELETE FROM tax_rates");
        jdbcTemplate.execute("DELETE FROM user_roles");
        jdbcTemplate.execute("DELETE FROM role_permissions");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM roles");
        jdbcTemplate.execute("DELETE FROM permissions");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenant1, "Org One", "ORG1", true
        );
        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenant2, "Org Two", "ORG2", true
        );
    }

    @Test
    @DisplayName("Create item with valid same-tenant category, unit, tax rate succeeded")
    void createItem_SameTenantReferences_Success() throws Exception {
        TenantContext.setTenantId(tenant1);
        enableTenantFilter(tenant1);

        ItemCategoryResponse category = categoryService.createCategory(new ItemCategoryRequest("Electronics", "ELEC", "Electronics category"));
        UnitResponse unit = unitService.createUnit(new UnitRequest("Piece", "PCS", "pc"));
        TaxRateResponse taxRate = taxRateService.createTaxRate(new TaxRateRequest("VAT Standard", new BigDecimal("18.00"), "VAT18", true));

        ItemRequest itemRequest = new ItemRequest(
                "Laptop Pro",
                "SKU-LAP-001",
                "High performance laptop",
                new BigDecimal("1200.00"),
                new BigDecimal("10.00"),
                "PCS",
                category.id(),
                unit.id(),
                taxRate.id(),
                true
        );

        mockMvc.perform(post("/api/v1/items")
                        .header("X-Tenant-ID", tenant1.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Laptop Pro")))
                .andExpect(jsonPath("$.data.category.name", is("Electronics")))
                .andExpect(jsonPath("$.data.unit.code", is("PCS")))
                .andExpect(jsonPath("$.data.taxRate.rate", is(18.00)));

        TenantContext.clear();
    }

    @Test
    @DisplayName("Create item referencing category from another organization throws BusinessRuleViolationException (400)")
    void createItem_CrossTenantCategoryReference_Returns400() throws Exception {
        // Create Category under tenant2
        TenantContext.setTenantId(tenant2);
        enableTenantFilter(tenant2);
        ItemCategoryResponse tenant2Category = categoryService.createCategory(new ItemCategoryRequest("Tenant2 Category", "T2CAT", "Desc"));
        TenantContext.clear();

        // Attempt to create Item under tenant1 referencing tenant2's Category
        TenantContext.setTenantId(tenant1);
        enableTenantFilter(tenant1);

        ItemRequest itemRequest = new ItemRequest(
                "Cross Tenant Item",
                "SKU-CROSS-001",
                "Cross tenant test item",
                new BigDecimal("100.00"),
                new BigDecimal("5.00"),
                "PCS",
                tenant2Category.id(),
                null,
                null,
                true
        );

        mockMvc.perform(post("/api/v1/items")
                        .header("X-Tenant-ID", tenant1.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        TenantContext.clear();
    }

    private void enableTenantFilter(UUID tenantId) {
        try {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter(TenantScopedEntity.TENANT_FILTER_NAME)
                    .setParameter(TenantScopedEntity.TENANT_PARAM_NAME, tenantId);
        } catch (Exception ignored) {
        }
    }
}
