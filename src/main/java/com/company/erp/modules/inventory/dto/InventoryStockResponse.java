package com.company.erp.modules.inventory.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InventoryStockResponse(
        UUID id,
        UUID organizationId,
        UUID warehouseId,
        String warehouseName,
        UUID itemId,
        String itemName,
        String sku,
        BigDecimal quantity
) {
}
