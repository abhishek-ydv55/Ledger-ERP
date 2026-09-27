package com.company.erp.modules.inventory.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.dto.InventoryMovementResponse;
import com.company.erp.modules.inventory.dto.InventoryStockResponse;
import com.company.erp.modules.inventory.dto.StockTransferItemRequest;
import com.company.erp.modules.inventory.dto.StockTransferItemResponse;
import com.company.erp.modules.inventory.dto.StockTransferRequest;
import com.company.erp.modules.inventory.dto.StockTransferResponse;
import com.company.erp.modules.inventory.entity.InventoryMovement;
import com.company.erp.modules.inventory.entity.InventoryStock;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.StockTransfer;
import com.company.erp.modules.inventory.entity.StockTransferItem;
import com.company.erp.modules.inventory.entity.StockTransferStatus;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.InventoryMovementRepository;
import com.company.erp.modules.inventory.repository.InventoryStockRepositoryAdapter;
import com.company.erp.modules.inventory.repository.StockTransferRepository;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final InventoryMovementRepository inventoryMovementRepository;
    private final InventoryStockRepositoryAdapter inventoryStockRepositoryAdapter;
    private final WarehouseRepository warehouseRepository;
    private final StockTransferRepository stockTransferRepository;
    private final ItemRepository itemRepository;

    public InventoryServiceImpl(InventoryMovementRepository inventoryMovementRepository,
                                InventoryStockRepositoryAdapter inventoryStockRepositoryAdapter,
                                WarehouseRepository warehouseRepository,
                                StockTransferRepository stockTransferRepository,
                                ItemRepository itemRepository) {
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.inventoryStockRepositoryAdapter = inventoryStockRepositoryAdapter;
        this.warehouseRepository = warehouseRepository;
        this.stockTransferRepository = stockTransferRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public InventoryMovement applyMovement(Item item, Warehouse warehouse, BigDecimal quantityDelta, MovementType type, String sourceType, UUID sourceId) {
        if (!item.isTrackInventory()) {
            throw new BusinessRuleViolationException("Inventory tracking is disabled for item: " + item.getName());
        }

        UUID orgId = TenantContext.getTenantId();
        if (orgId == null) {
            orgId = warehouse.getOrganizationId();
        }

        InventoryMovement movement = new InventoryMovement(
                warehouse,
                item,
                quantityDelta,
                type,
                sourceType,
                sourceId
        );
        movement.setOrganizationId(orgId);
        InventoryMovement savedMovement = inventoryMovementRepository.save(movement);

        inventoryStockRepositoryAdapter.upsertStock(orgId, warehouse.getId(), item.getId(), quantityDelta);

        return savedMovement;
    }

    @Override
    public StockTransferResponse createStockTransfer(StockTransferRequest request) {
        Warehouse sourceWarehouse = warehouseRepository.findById(request.sourceWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found with id: " + request.sourceWarehouseId()));

        Warehouse destinationWarehouse = warehouseRepository.findById(request.destinationWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found with id: " + request.destinationWarehouseId()));

        if (sourceWarehouse.getId().equals(destinationWarehouse.getId())) {
            throw new BusinessRuleViolationException("Source and destination warehouses cannot be the same");
        }

        if (stockTransferRepository.existsByTransferNumber(request.transferNumber())) {
            throw new BusinessRuleViolationException("Stock transfer with number '" + request.transferNumber() + "' already exists");
        }

        StockTransfer transfer = new StockTransfer(
                request.transferNumber(),
                sourceWarehouse,
                destinationWarehouse,
                StockTransferStatus.DRAFT,
                request.notes()
        );
        transfer.setOrganizationId(TenantContext.getTenantId());

        for (StockTransferItemRequest itemReq : request.items()) {
            Item item = itemRepository.findById(itemReq.itemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemReq.itemId()));
            StockTransferItem transferItem = new StockTransferItem(item, itemReq.quantity());
            transfer.addItem(transferItem);
        }

        StockTransfer saved = stockTransferRepository.save(transfer);
        return mapToTransferResponse(saved);
    }

    @Override
    public StockTransferResponse completeStockTransfer(UUID transferId) {
        StockTransfer transfer = stockTransferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock transfer not found with id: " + transferId));

        if (transfer.getStatus() == StockTransferStatus.COMPLETED) {
            throw new BusinessRuleViolationException("Stock transfer is already completed");
        }

        if (transfer.getStatus() == StockTransferStatus.CANCELLED) {
            throw new BusinessRuleViolationException("Cannot complete a cancelled stock transfer");
        }

        for (StockTransferItem transferItem : transfer.getItems()) {
            applyMovement(
                    transferItem.getItem(),
                    transfer.getSourceWarehouse(),
                    transferItem.getQuantity().negate(),
                    MovementType.TRANSFER_OUT,
                    "STOCK_TRANSFER",
                    transfer.getId()
            );

            applyMovement(
                    transferItem.getItem(),
                    transfer.getDestinationWarehouse(),
                    transferItem.getQuantity(),
                    MovementType.TRANSFER_IN,
                    "STOCK_TRANSFER",
                    transfer.getId()
            );
        }

        transfer.setStatus(StockTransferStatus.COMPLETED);
        StockTransfer updated = stockTransferRepository.save(transfer);
        return mapToTransferResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public StockTransferResponse getStockTransferById(UUID id) {
        StockTransfer transfer = stockTransferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock transfer not found with id: " + id));
        return mapToTransferResponse(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockTransferResponse> getAllStockTransfers() {
        return stockTransferRepository.findAll().stream()
                .map(this::mapToTransferResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> getStockByWarehouse(UUID warehouseId) {
        return inventoryStockRepositoryAdapter.findByWarehouseId(warehouseId).stream()
                .map(this::mapToStockResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> getAllStock() {
        return inventoryStockRepositoryAdapter.findAll().stream()
                .map(this::mapToStockResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> getMovementsByWarehouseAndItem(UUID warehouseId, UUID itemId) {
        return inventoryMovementRepository.findByWarehouseIdAndItemId(warehouseId, itemId).stream()
                .map(this::mapToMovementResponse)
                .collect(Collectors.toList());
    }

    private StockTransferResponse mapToTransferResponse(StockTransfer transfer) {
        List<StockTransferItemResponse> itemResponses = transfer.getItems().stream()
                .map(item -> new StockTransferItemResponse(
                        item.getId(),
                        item.getItem().getId(),
                        item.getItem().getName(),
                        item.getItem().getSku(),
                        item.getQuantity()
                ))
                .collect(Collectors.toList());

        return new StockTransferResponse(
                transfer.getId(),
                transfer.getOrganizationId(),
                transfer.getTransferNumber(),
                transfer.getSourceWarehouse().getId(),
                transfer.getSourceWarehouse().getName(),
                transfer.getDestinationWarehouse().getId(),
                transfer.getDestinationWarehouse().getName(),
                transfer.getStatus(),
                transfer.getNotes(),
                itemResponses,
                transfer.getCreatedAt(),
                transfer.getUpdatedAt()
        );
    }

    private InventoryStockResponse mapToStockResponse(InventoryStock stock) {
        return new InventoryStockResponse(
                stock.getId(),
                stock.getOrganizationId(),
                stock.getWarehouse().getId(),
                stock.getWarehouse().getName(),
                stock.getItem().getId(),
                stock.getItem().getName(),
                stock.getItem().getSku(),
                stock.getQuantity()
        );
    }

    private InventoryMovementResponse mapToMovementResponse(InventoryMovement movement) {
        return new InventoryMovementResponse(
                movement.getId(),
                movement.getOrganizationId(),
                movement.getWarehouse().getId(),
                movement.getItem().getId(),
                movement.getQuantityDelta(),
                movement.getMovementType(),
                movement.getSourceType(),
                movement.getSourceId(),
                movement.getCreatedAt()
        );
    }
}
