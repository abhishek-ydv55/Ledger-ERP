package com.company.erp.modules.inventory;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.domain.TenantScopedEntity;
import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.dto.InventoryStockResponse;
import com.company.erp.modules.inventory.dto.StockTransferItemRequest;
import com.company.erp.modules.inventory.dto.StockTransferRequest;
import com.company.erp.modules.inventory.dto.StockTransferResponse;
import com.company.erp.modules.inventory.dto.WarehouseRequest;
import com.company.erp.modules.inventory.dto.WarehouseResponse;
import com.company.erp.modules.inventory.entity.InventoryMovement;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.StockTransferStatus;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.InventoryMovementRepository;
import com.company.erp.modules.inventory.repository.InventoryStockRepositoryAdapter;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import com.company.erp.modules.inventory.service.InventoryService;
import com.company.erp.modules.inventory.service.WarehouseService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@AutoConfigureMockMvc(addFilters = false)
public class InventoryIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private InventoryMovementRepository movementRepository;

    @Autowired
    private InventoryStockRepositoryAdapter stockRepositoryAdapter;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private final UUID tenant1 = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM stock_transfer_items");
        jdbcTemplate.execute("DELETE FROM stock_transfers");
        jdbcTemplate.execute("DELETE FROM inventory_movements");
        jdbcTemplate.execute("DELETE FROM inventory_stock");
        jdbcTemplate.execute("DELETE FROM warehouses");
        jdbcTemplate.execute("DELETE FROM items");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenant1, "Org One", "ORG1", true
        );

        TenantContext.setTenantId(tenant1);
        enableTenantFilter(tenant1);
    }

    @Test
    @DisplayName("Applying movement updates both ledger and stock snapshot correctly")
    void applyMovement_UpdatesLedgerAndSnapshot_Success() {
        WarehouseResponse whResp = warehouseService.createWarehouse(new WarehouseRequest("Main Warehouse", "WH-01", "Building A", true));
        Warehouse warehouse = warehouseRepository.findById(whResp.id()).orElseThrow();

        Item item = new Item("Widget A", "SKU-WIDGET-01", "Test widget", new BigDecimal("50.00"), BigDecimal.ZERO, "PCS");
        item.setOrganizationId(tenant1);
        item.setTrackInventory(true);
        item = itemRepository.save(item);

        // Apply positive movement (+100)
        InventoryMovement movement1 = inventoryService.applyMovement(
                item, warehouse, new BigDecimal("100.00"), MovementType.PURCHASE_RECEIPT, "PURCHASE_ORDER", UUID.randomUUID()
        );

        assertThat(movement1).isNotNull();
        assertThat(movement1.getQuantityDelta()).isEqualByComparingTo("100.00");

        // Verify ledger
        List<InventoryMovement> movements = movementRepository.findByWarehouseIdAndItemId(warehouse.getId(), item.getId());
        assertThat(movements).hasSize(1);
        assertThat(movements.get(0).getQuantityDelta()).isEqualByComparingTo("100.00");

        // Verify stock snapshot
        List<InventoryStockResponse> stock = inventoryService.getStockByWarehouse(warehouse.getId());
        assertThat(stock).hasSize(1);
        assertThat(stock.get(0).quantity()).isEqualByComparingTo("100.00");

        // Apply negative movement (-30)
        inventoryService.applyMovement(
                item, warehouse, new BigDecimal("-30.00"), MovementType.SALES_SHIPMENT, "SALES_ORDER", UUID.randomUUID()
        );

        // Verify updated ledger and stock snapshot
        movements = movementRepository.findByWarehouseIdAndItemId(warehouse.getId(), item.getId());
        assertThat(movements).hasSize(2);

        stock = inventoryService.getStockByWarehouse(warehouse.getId());
        assertThat(stock.get(0).quantity()).isEqualByComparingTo("70.00");
    }

    @Test
    @DisplayName("Applying movement for item with track_inventory = false throws BusinessRuleViolationException")
    void applyMovement_TrackInventoryFalse_ThrowsException() {
        WarehouseResponse whResp = warehouseService.createWarehouse(new WarehouseRequest("Main Warehouse", "WH-02", "Building B", true));
        Warehouse warehouse = warehouseRepository.findById(whResp.id()).orElseThrow();

        Item item = new Item("Service Item", "SKU-SERVICE-01", "Non-tracked service", new BigDecimal("100.00"), BigDecimal.ZERO, "HRS");
        item.setOrganizationId(tenant1);
        item.setTrackInventory(false);
        Item savedItem = itemRepository.save(item);

        assertThatThrownBy(() -> inventoryService.applyMovement(
                savedItem, warehouse, new BigDecimal("10.00"), MovementType.ADJUSTMENT, "MANUAL", UUID.randomUUID()
        )).isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Inventory tracking is disabled for item");
    }

    @Test
    @DisplayName("Create and complete stock transfer calls applyMovement twice and updates stock correctly")
    void stockTransfer_CreateAndComplete_Success() {
        WarehouseResponse wh1Resp = warehouseService.createWarehouse(new WarehouseRequest("Warehouse Alpha", "WH-A", "Loc A", true));
        WarehouseResponse wh2Resp = warehouseService.createWarehouse(new WarehouseRequest("Warehouse Beta", "WH-B", "Loc B", true));

        Warehouse whA = warehouseRepository.findById(wh1Resp.id()).orElseThrow();
        Warehouse whB = warehouseRepository.findById(wh2Resp.id()).orElseThrow();

        Item item = new Item("Transfer Item", "SKU-TRF-01", "Item to transfer", new BigDecimal("25.00"), BigDecimal.ZERO, "PCS");
        item.setOrganizationId(tenant1);
        item.setTrackInventory(true);
        item = itemRepository.save(item);

        // Initial stock at WH-A = 50.00
        inventoryService.applyMovement(item, whA, new BigDecimal("50.00"), MovementType.PURCHASE_RECEIPT, "INIT", UUID.randomUUID());

        // Create Stock Transfer
        StockTransferRequest request = new StockTransferRequest(
                "STR-001",
                whA.getId(),
                whB.getId(),
                "Transfer 20 units from Alpha to Beta",
                List.of(new StockTransferItemRequest(item.getId(), new BigDecimal("20.00")))
        );

        StockTransferResponse transferResponse = inventoryService.createStockTransfer(request);
        assertThat(transferResponse.status()).isEqualTo(StockTransferStatus.DRAFT);

        // Complete Stock Transfer
        StockTransferResponse completedResponse = inventoryService.completeStockTransfer(transferResponse.id());
        assertThat(completedResponse.status()).isEqualTo(StockTransferStatus.COMPLETED);

        // Check stock at WH-A (should be 50 - 20 = 30)
        List<InventoryStockResponse> stockA = inventoryService.getStockByWarehouse(whA.getId());
        assertThat(stockA.get(0).quantity()).isEqualByComparingTo("30.00");

        // Check stock at WH-B (should be 0 + 20 = 20)
        List<InventoryStockResponse> stockB = inventoryService.getStockByWarehouse(whB.getId());
        assertThat(stockB.get(0).quantity()).isEqualByComparingTo("20.00");

        // Check movements logged for WH-A and WH-B
        List<InventoryMovement> movementsA = movementRepository.findByWarehouseIdAndItemId(whA.getId(), item.getId());
        // 1 INITIAL + 1 TRANSFER_OUT = 2 movements
        assertThat(movementsA).hasSize(2);

        List<InventoryMovement> movementsB = movementRepository.findByWarehouseIdAndItemId(whB.getId(), item.getId());
        // 1 TRANSFER_IN = 1 movement
        assertThat(movementsB).hasSize(1);
        assertThat(movementsB.get(0).getMovementType()).isEqualTo(MovementType.TRANSFER_IN);
    }

    @Test
    @DisplayName("Concurrent applyMovement calls on same item/warehouse do not lose updates")
    void concurrentApplyMovement_NoLostUpdates() throws InterruptedException {
        WarehouseResponse whResp = warehouseService.createWarehouse(new WarehouseRequest("Concurrency WH", "WH-CONC", "Loc C", true));
        Warehouse warehouse = warehouseRepository.findById(whResp.id()).orElseThrow();

        Item item = new Item("Concurrent Item", "SKU-CONC-01", "Item for concurrent test", new BigDecimal("10.00"), BigDecimal.ZERO, "PCS");
        item.setOrganizationId(tenant1);
        item.setTrackInventory(true);
        Item savedItem = itemRepository.save(item);

        int threadCount = 10;
        BigDecimal deltaPerThread = new BigDecimal("10.00");

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    TenantContext.setTenantId(tenant1);
                    inventoryService.applyMovement(
                            savedItem, warehouse, deltaPerThread, MovementType.PURCHASE_RECEIPT, "CONCURRENT_TEST", UUID.randomUUID()
                    );
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    TenantContext.clear();
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        endLatch.await();
        executor.shutdown();

        // Verify stock quantity is threadCount * deltaPerThread = 10 * 10.00 = 100.00
        List<InventoryStockResponse> stockList = inventoryService.getStockByWarehouse(warehouse.getId());
        assertThat(stockList).hasSize(1);
        assertThat(stockList.get(0).quantity()).isEqualByComparingTo("100.00");

        // Verify ledger entries count = 10
        List<InventoryMovement> movements = movementRepository.findByWarehouseIdAndItemId(warehouse.getId(), savedItem.getId());
        assertThat(movements).hasSize(10);
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
