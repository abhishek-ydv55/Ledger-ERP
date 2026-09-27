package com.company.erp.modules.inventory.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StockTransferItemResponse(
        UUID id,
        UUID itemId,
        String itemName,
        String sku,
        BigDecimal quantity
) {
}
