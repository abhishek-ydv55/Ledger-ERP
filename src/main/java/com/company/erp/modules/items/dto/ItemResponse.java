package com.company.erp.modules.items.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ItemResponse(
        UUID id,
        UUID organizationId,
        String name,
        String sku,
        String description,
        BigDecimal unitPrice,
        BigDecimal quantityOnHand,
        String unitOfMeasure,
        boolean active,
        ItemCategoryResponse category,
        UnitResponse unit,
        TaxRateResponse taxRate,
        Instant createdAt,
        Instant updatedAt
) {
}
