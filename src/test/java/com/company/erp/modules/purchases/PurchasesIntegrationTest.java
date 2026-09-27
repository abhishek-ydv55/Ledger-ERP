package com.company.erp.modules.purchases;

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
import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.dto.PurchaseItemRequest;
import com.company.erp.modules.purchases.entity.BillStatus;
import com.company.erp.modules.purchases.service.BillService;
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
public class PurchasesIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BillService billService;

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
        jdbcTemplate.execute("DELETE FROM bill_items");
        jdbcTemplate.execute("DELETE FROM bills");
        jdbcTemplate.execute("DELETE FROM purchase_order_items");
        jdbcTemplate.execute("DELETE FROM purchase_orders");
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
    @DisplayName("Recording a bill updates bill status to RECORDED, posts balanced journal entry, and increases inventory stock & movements")
    void recordBill_TriggersAccountingAndInventoryListeners_Success() {
        // 1. Setup Vendor Party
        Party vendor = new Party("Global Supplies Inc", "SUPPLIER-01", null, null, null, true);
        vendor.setOrganizationId(tenant1);
        vendor = partyRepository.save(vendor);

        // 2. Setup Warehouse
        WarehouseResponse whResp = warehouseService.createWarehouse(new WarehouseRequest("Receiving Warehouse", "WH-REC", "Dock 1", true));
        Warehouse warehouse = warehouseRepository.findById(whResp.id()).orElseThrow();

        // 3. Setup Item with track_inventory = true and initial stock = 0
        Item item = new Item("Raw Material X", "SKU-RAW-X", "Steel Plates", new BigDecimal("100.00"), BigDecimal.ZERO, "PCS");
        item.setOrganizationId(tenant1);
        item.setTrackInventory(true);
        Item savedItem = itemRepository.save(item);

        // 4. Create Draft Bill (Quantity = 5, UnitPrice = 100.00, Subtotal = 500.00, Tax = 10% = 50.00, Total = 550.00)
        PurchaseItemRequest itemRequest = new PurchaseItemRequest(
                savedItem.getId(),
                "5 Steel Plates",
                new BigDecimal("5.00"),
                new BigDecimal("100.00"),
                new BigDecimal("10.00")
        );

        BillRequest billRequest = new BillRequest(
                vendor.getId(),
                null,
                warehouse.getId(),
                "BILL-2026-001",
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                "Purchase bill for steel plates",
                List.of(itemRequest)
        );

        BillResponse draftBill = billService.createBill(billRequest);
        assertThat(draftBill.status()).isEqualTo(BillStatus.DRAFT);
        assertThat(draftBill.totalAmount()).isEqualByComparingTo("550.00");

        // 5. Record the Bill
        BillResponse recordedBill = billService.recordBill(draftBill.id());

        // ASSERT 1: Bill status is RECORDED
        assertThat(recordedBill.status()).isEqualTo(BillStatus.RECORDED);

        // ASSERT 2: Matching posted & balanced journal entry exists in accounting
        List<JournalEntry> journalEntries = journalEntryRepository.findAll();
        assertThat(journalEntries).hasSize(1);
        JournalEntry je = journalEntries.get(0);
        assertThat(je.getStatus()).isEqualTo(JournalEntryStatus.POSTED);
        assertThat(je.getSourceType()).isEqualTo("BILL");
        assertThat(je.getSourceId()).isEqualTo(recordedBill.id());

        BigDecimal totalDebit = je.getLines().stream().map(l -> l.getDebit() != null ? l.getDebit() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = je.getLines().stream().map(l -> l.getCredit() != null ? l.getCredit() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(totalDebit).isEqualByComparingTo("550.00");
        assertThat(totalCredit).isEqualByComparingTo("550.00");

        // ASSERT 3: Inventory stock is increased (0 + 5 = 5) and movement is logged
        List<InventoryStockResponse> stockList = inventoryService.getStockByWarehouse(warehouse.getId());
        assertThat(stockList).hasSize(1);
        assertThat(stockList.get(0).quantity()).isEqualByComparingTo("5.00");

        List<InventoryMovement> movements = movementRepository.findByWarehouseIdAndItemId(warehouse.getId(), savedItem.getId());
        assertThat(movements).hasSize(1);
        InventoryMovement purchaseMovement = movements.get(0);
        assertThat(purchaseMovement.getMovementType()).isEqualTo(MovementType.PURCHASE);
        assertThat(purchaseMovement.getQuantityDelta()).isEqualByComparingTo("5.00");
        assertThat(purchaseMovement.getSourceType()).isEqualTo("BILL");
        assertThat(purchaseMovement.getSourceId()).isEqualTo(recordedBill.id());
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
