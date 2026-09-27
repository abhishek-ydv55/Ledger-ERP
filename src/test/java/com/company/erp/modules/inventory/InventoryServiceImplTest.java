package com.company.erp.modules.inventory;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.dto.StockTransferItemRequest;
import com.company.erp.modules.inventory.dto.StockTransferRequest;
import com.company.erp.modules.inventory.dto.StockTransferResponse;
import com.company.erp.modules.inventory.entity.InventoryMovement;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.StockTransfer;
import com.company.erp.modules.inventory.entity.StockTransferItem;
import com.company.erp.modules.inventory.entity.StockTransferStatus;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.InventoryMovementRepository;
import com.company.erp.modules.inventory.repository.InventoryStockRepositoryAdapter;
import com.company.erp.modules.inventory.repository.StockTransferRepository;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import com.company.erp.modules.inventory.service.InventoryServiceImpl;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    @Mock
    private InventoryStockRepositoryAdapter inventoryStockRepositoryAdapter;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private StockTransferRepository stockTransferRepository;

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("applyMovement inserts movement and calls upsertStock atomically when trackInventory = true")
    void applyMovement_Success() {
        Warehouse warehouse = new Warehouse("Central Warehouse", "WH-CENTRAL", "Loc", true);
        warehouse.setId(UUID.randomUUID());
        warehouse.setOrganizationId(tenantId);

        Item item = new Item("Product A", "SKU-PROD-A", "Desc", new BigDecimal("100.00"), BigDecimal.ZERO, "PCS");
        item.setId(UUID.randomUUID());
        item.setOrganizationId(tenantId);
        item.setTrackInventory(true);

        when(inventoryMovementRepository.save(any(InventoryMovement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BigDecimal delta = new BigDecimal("50.00");
        UUID sourceId = UUID.randomUUID();

        InventoryMovement movement = inventoryService.applyMovement(
                item, warehouse, delta, MovementType.PURCHASE_RECEIPT, "PURCHASE_ORDER", sourceId
        );

        assertThat(movement).isNotNull();
        assertThat(movement.getQuantityDelta()).isEqualTo(delta);
        assertThat(movement.getMovementType()).isEqualTo(MovementType.PURCHASE_RECEIPT);

        verify(inventoryMovementRepository).save(any(InventoryMovement.class));
        verify(inventoryStockRepositoryAdapter).upsertStock(eq(tenantId), eq(warehouse.getId()), eq(item.getId()), eq(delta));
    }

    @Test
    @DisplayName("applyMovement throws BusinessRuleViolationException when trackInventory = false")
    void applyMovement_TrackInventoryFalse_ThrowsException() {
        Warehouse warehouse = new Warehouse("Central Warehouse", "WH-CENTRAL", "Loc", true);
        warehouse.setId(UUID.randomUUID());

        Item item = new Item("Service", "SKU-SRV", "Desc", new BigDecimal("100.00"), BigDecimal.ZERO, "HRS");
        item.setId(UUID.randomUUID());
        item.setTrackInventory(false);

        assertThatThrownBy(() -> inventoryService.applyMovement(
                item, warehouse, new BigDecimal("10.00"), MovementType.ADJUSTMENT, "MANUAL", UUID.randomUUID()
        )).isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Inventory tracking is disabled for item");
    }

    @Test
    @DisplayName("completeStockTransfer calls applyMovement twice (TRANSFER_OUT and TRANSFER_IN) per item")
    void completeStockTransfer_CallsApplyMovementTwice() {
        UUID transferId = UUID.randomUUID();

        Warehouse whA = new Warehouse("Warehouse A", "WH-A", "Loc A", true);
        whA.setId(UUID.randomUUID());
        whA.setOrganizationId(tenantId);

        Warehouse whB = new Warehouse("Warehouse B", "WH-B", "Loc B", true);
        whB.setId(UUID.randomUUID());
        whB.setOrganizationId(tenantId);

        Item item = new Item("Item 1", "SKU-1", "Desc", new BigDecimal("10.00"), BigDecimal.ZERO, "PCS");
        item.setId(UUID.randomUUID());
        item.setOrganizationId(tenantId);
        item.setTrackInventory(true);

        StockTransfer transfer = new StockTransfer("STR-100", whA, whB, StockTransferStatus.DRAFT, "Transfer notes");
        transfer.setId(transferId);
        transfer.setOrganizationId(tenantId);
        transfer.addItem(new StockTransferItem(item, new BigDecimal("15.00")));

        when(stockTransferRepository.findById(transferId)).thenReturn(Optional.of(transfer));
        when(stockTransferRepository.save(any(StockTransfer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        StockTransferResponse response = inventoryService.completeStockTransfer(transferId);

        assertThat(response.status()).isEqualTo(StockTransferStatus.COMPLETED);

        // Verify applyMovement was executed twice:
        // 1. TRANSFER_OUT at WH-A with delta -15.00
        // 2. TRANSFER_IN at WH-B with delta +15.00
        verify(inventoryStockRepositoryAdapter).upsertStock(eq(tenantId), eq(whA.getId()), eq(item.getId()), eq(new BigDecimal("-15.00")));
        verify(inventoryStockRepositoryAdapter).upsertStock(eq(tenantId), eq(whB.getId()), eq(item.getId()), eq(new BigDecimal("15.00")));

        ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(inventoryMovementRepository, times(2)).save(movementCaptor.capture());

        List<InventoryMovement> capturedMovements = movementCaptor.getAllValues();
        assertThat(capturedMovements).hasSize(2);
        assertThat(capturedMovements.get(0).getMovementType()).isEqualTo(MovementType.TRANSFER_OUT);
        assertThat(capturedMovements.get(0).getQuantityDelta()).isEqualTo(new BigDecimal("-15.00"));
        assertThat(capturedMovements.get(1).getMovementType()).isEqualTo(MovementType.TRANSFER_IN);
        assertThat(capturedMovements.get(1).getQuantityDelta()).isEqualTo(new BigDecimal("15.00"));
    }
}
