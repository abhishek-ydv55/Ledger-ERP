package com.company.erp.modules.sales.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SalesItemResponse(
        UUID id,
        UUID itemId,
        String itemName,
        String sku,
        String description,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount
) {
}
