package com.company.erp.modules.parties;

import com.company.erp.common.domain.TenantScopedEntity;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.parties.dto.PartyAddressRequest;
import com.company.erp.modules.parties.dto.PartyContactRequest;
import com.company.erp.modules.parties.dto.PartyRequest;
import com.company.erp.modules.parties.entity.PartyRole;
import com.fasterxml.jackson.core.type.TypeReference;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
public class PartyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private final UUID tenantId = UUID.fromString("33333333-3333-3333-3333-333333333333");

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
                tenantId, "Party Test Org", "PT_ORG", true
        );

        TenantContext.setTenantId(tenantId);
        try {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter(TenantScopedEntity.TENANT_FILTER_NAME)
                    .setParameter(TenantScopedEntity.TENANT_PARAM_NAME, tenantId);
        } catch (Exception ignored) {
        }
    }

    @Test
    @DisplayName("Dual-role party is accessible from both CustomerController and VendorController")
    void dualRoleParty_AccessibleByBothControllers() throws Exception {
        PartyRequest request = new PartyRequest(
                "Dual Role Enterprise",
                "DRE-001",
                "contact@dualrole.com",
                "+1-555-0199",
                "TAX-DUAL-999",
                true,
                Set.of(PartyRole.CUSTOMER, PartyRole.VENDOR),
                List.of(new PartyContactRequest("Alice Smith", "alice@dualrole.com", "+1-555-0100", "Account Manager", true)),
                List.of(new PartyAddressRequest("BILLING", "100 Main St", "Suite 200", "Tech City", "CA", "94016", "USA", true))
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/customers")
                        .header("X-Tenant-ID", tenantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Dual Role Enterprise")))
                .andExpect(jsonPath("$.data.contacts", hasSize(1)))
                .andExpect(jsonPath("$.data.addresses", hasSize(1)))
                .andReturn();

        String body = createResult.getResponse().getContentAsString();
        Map<String, Object> map = objectMapper.readValue(body, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) map.get("data");
        String partyId = (String) data.get("id");

        // Verify Customer Controller lists dual-role party
        mockMvc.perform(get("/api/v1/customers")
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(partyId)));

        // Verify Vendor Controller lists dual-role party
        mockMvc.perform(get("/api/v1/vendors")
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(partyId)));

        // Verify Customer Controller GET by ID
        mockMvc.perform(get("/api/v1/customers/" + partyId)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Dual Role Enterprise")));

        // Verify Vendor Controller GET by ID
        mockMvc.perform(get("/api/v1/vendors/" + partyId)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Dual Role Enterprise")));
    }

    @Test
    @DisplayName("Role filtering: Customer endpoint 404s Vendor-only party, Vendor endpoint 404s Customer-only party")
    void roleFiltering_StrictIsolation_Returns404() throws Exception {
        // Create Customer-only party
        PartyRequest customerReq = new PartyRequest(
                "Acme Retail", "CUST-001", "info@acme.com", "+1-555-1111", null, true,
                Set.of(PartyRole.CUSTOMER), List.of(), List.of()
        );
        MvcResult custResult = mockMvc.perform(post("/api/v1/customers")
                        .header("X-Tenant-ID", tenantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String customerId = extractId(custResult);

        // Create Vendor-only party
        PartyRequest vendorReq = new PartyRequest(
                "Global Supplies Ltd", "VEND-001", "sales@globalsupplies.com", "+1-555-2222", null, true,
                Set.of(PartyRole.VENDOR), List.of(), List.of()
        );
        MvcResult vendResult = mockMvc.perform(post("/api/v1/vendors")
                        .header("X-Tenant-ID", tenantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(vendorReq)))
                .andExpect(status().isCreated())
                .andReturn();
        String vendorId = extractId(vendResult);

        // Customer endpoint GET customerId -> 200 OK
        mockMvc.perform(get("/api/v1/customers/" + customerId)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Acme Retail")));

        // Vendor endpoint GET customerId -> 404 NOT FOUND
        mockMvc.perform(get("/api/v1/vendors/" + customerId)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        // Vendor endpoint GET vendorId -> 200 OK
        mockMvc.perform(get("/api/v1/vendors/" + vendorId)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Global Supplies Ltd")));

        // Customer endpoint GET vendorId -> 404 NOT FOUND
        mockMvc.perform(get("/api/v1/customers/" + vendorId)
                        .header("X-Tenant-ID", tenantId.toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    private String extractId(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        Map<String, Object> map = objectMapper.readValue(body, new TypeReference<>() {});
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) map.get("data");
        return (String) data.get("id");
    }
}
