package com.company.erp.modules.inventory.service;

import com.company.erp.modules.inventory.dto.InventoryMovementResponse;
import com.company.erp.modules.inventory.dto.InventoryStockResponse;
import com.company.erp.modules.inventory.dto.StockTransferRequest;
import com.company.erp.modules.inventory.dto.StockTransferResponse;
import com.company.erp.modules.inventory.entity.InventoryMovement;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.items.entity.Item;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface InventoryService {

    InventoryMovement applyMovement(Item item, Warehouse warehouse, BigDecimal quantityDelta, MovementType type, String sourceType, UUID sourceId);

    StockTransferResponse createStockTransfer(StockTransferRequest request);

    StockTransferResponse completeStockTransfer(UUID transferId);

    StockTransferResponse getStockTransferById(UUID id);

    List<StockTransferResponse> getAllStockTransfers();

    List<InventoryStockResponse> getStockByWarehouse(UUID warehouseId);

    List<InventoryStockResponse> getAllStock();

    List<InventoryMovementResponse> getMovementsByWarehouseAndItem(UUID warehouseId, UUID itemId);
}
