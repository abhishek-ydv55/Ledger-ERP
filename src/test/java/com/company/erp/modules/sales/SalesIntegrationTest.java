package com.company.erp.modules.sales;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.domain.TenantScopedEntity;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.entity.JournalEntry;
import com.company.erp.modules.accounting.entity.JournalEntryStatus;
import com.company.erp.modules.accounting.repository.JournalEntryRepository;
import com.company.erp.modules.inventory.dto.InventoryStockResponse;
import com.company.erp.modules.inventory.dto.WarehouseRequest;
import com.company.erp.modules.inventory.dto.WarehouseResponse;
import com.company.erp.modules.inventory.entity.InventoryMovement;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.InventoryMovementRepository;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import com.company.erp.modules.inventory.service.InventoryService;
import com.company.erp.modules.inventory.service.WarehouseService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;

import com.company.erp.modules.sales.dto.InvoiceRequest;
import com.company.erp.modules.sales.dto.InvoiceResponse;
import com.company.erp.modules.sales.dto.SalesItemRequest;
import com.company.erp.modules.sales.entity.InvoiceStatus;
import com.company.erp.modules.sales.service.InvoiceService;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureMockMvc(addFilters = false)
public class SalesIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryMovementRepository movementRepository;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private final UUID tenant1 = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM journal_entry_lines");
        jdbcTemplate.execute("DELETE FROM journal_entries");
        jdbcTemplate.execute("DELETE FROM invoice_items");
        jdbcTemplate.execute("DELETE FROM invoices");
        jdbcTemplate.execute("DELETE FROM sales_order_items");
        jdbcTemplate.execute("DELETE FROM sales_orders");
        jdbcTemplate.execute("DELETE FROM estimate_items");
        jdbcTemplate.execute("DELETE FROM estimates");
        jdbcTemplate.execute("DELETE FROM inventory_movements");
        jdbcTemplate.execute("DELETE FROM inventory_stock");
        jdbcTemplate.execute("DELETE FROM warehouses");
        jdbcTemplate.execute("DELETE FROM party_roles");
        jdbcTemplate.execute("DELETE FROM parties");
        jdbcTemplate.execute("DELETE FROM items");
        jdbcTemplate.execute("DELETE FROM chart_of_accounts");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenant1, "Org One", "ORG1", true
        );

        TenantContext.setTenantId(tenant1);
        enableTenantFilter(tenant1);
    }

    @Test
    @DisplayName("Issuing an invoice updates invoice status to ISSUED, posts balanced journal entry, and updates inventory stock & movements")
    void issueInvoice_TriggersAccountingAndInventoryListeners_Success() {
        // 1. Setup Customer Party
        Party customer = new Party("Acme Corporation", "Acme", null, null, null, true);
        customer.setOrganizationId(tenant1);
        customer = partyRepository.save(customer);

        // 2. Setup Warehouse
        WarehouseResponse whResp = warehouseService.createWarehouse(new WarehouseRequest("Sales Warehouse", "WH-SALES", "Main Hub", true));
        Warehouse warehouse = warehouseRepository.findById(whResp.id()).orElseThrow();

        // 3. Setup Item with track_inventory = true and initial stock = 100.00
        Item item = new Item("Laptops", "SKU-LAPTOP-100", "Gaming Laptop", new BigDecimal("1000.00"), BigDecimal.ZERO, "PCS");
        item.setOrganizationId(tenant1);
        item.setTrackInventory(true);
        Item savedItem = itemRepository.save(item);

        inventoryService.applyMovement(
                savedItem, warehouse, new BigDecimal("100.00"), MovementType.PURCHASE_RECEIPT, "INIT", UUID.randomUUID()
        );

        // 4. Create Draft Invoice (Quantity = 2, UnitPrice = 1000.00, Subtotal = 2000.00, Tax = 10% = 200.00, Total = 2200.00)
        SalesItemRequest itemRequest = new SalesItemRequest(
                savedItem.getId(),
                "2 Laptops",
                new BigDecimal("2.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("10.00")
        );

        InvoiceRequest invoiceRequest = new InvoiceRequest(
                customer.getId(),
                null,
                warehouse.getId(),
                "INV-2026-001",
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                "Standard sales invoice",
                List.of(itemRequest)
        );

        InvoiceResponse draftInvoice = invoiceService.createInvoice(invoiceRequest);
        assertThat(draftInvoice.status()).isEqualTo(InvoiceStatus.DRAFT);
        assertThat(draftInvoice.totalAmount()).isEqualByComparingTo("2200.00");

        // 5. Issue the Invoice
        InvoiceResponse issuedInvoice = invoiceService.issueInvoice(draftInvoice.id());

        // ASSERT 1: Invoice status is ISSUED
        assertThat(issuedInvoice.status()).isEqualTo(InvoiceStatus.ISSUED);

        // ASSERT 2: Matching posted & balanced journal entry exists in accounting
        List<JournalEntry> journalEntries = journalEntryRepository.findAll();
        assertThat(journalEntries).hasSize(1);
        JournalEntry je = journalEntries.get(0);
        assertThat(je.getStatus()).isEqualTo(JournalEntryStatus.POSTED);
        assertThat(je.getSourceType()).isEqualTo("INVOICE");
        assertThat(je.getSourceId()).isEqualTo(issuedInvoice.id());

        BigDecimal totalDebit = je.getLines().stream().map(l -> l.getDebit() != null ? l.getDebit() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = je.getLines().stream().map(l -> l.getCredit() != null ? l.getCredit() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(totalDebit).isEqualByComparingTo("2200.00");
        assertThat(totalCredit).isEqualByComparingTo("2200.00");

        // ASSERT 3: Inventory stock is reduced (100 - 2 = 98) and movement is logged
        List<InventoryStockResponse> stockList = inventoryService.getStockByWarehouse(warehouse.getId());
        assertThat(stockList).hasSize(1);
        assertThat(stockList.get(0).quantity()).isEqualByComparingTo("98.00");

        List<InventoryMovement> movements = movementRepository.findByWarehouseIdAndItemId(warehouse.getId(), savedItem.getId());
        // 1 INIT + 1 SALE = 2 movements
        assertThat(movements).hasSize(2);

        InventoryMovement saleMovement = movements.stream()
                .filter(m -> m.getMovementType() == MovementType.SALE)
                .findFirst()
                .orElseThrow();

        assertThat(saleMovement.getQuantityDelta()).isEqualByComparingTo("-2.00");
        assertThat(saleMovement.getSourceType()).isEqualTo("INVOICE");
        assertThat(saleMovement.getSourceId()).isEqualTo(issuedInvoice.id());
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
