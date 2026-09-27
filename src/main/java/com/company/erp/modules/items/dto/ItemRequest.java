package com.company.erp.modules.items.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.UUID;

public record ItemRequest(
        @NotBlank(message = "Item name is required")
        String name,

        @NotBlank(message = "SKU is required")
        String sku,

        String description,

        @NotNull(message = "Unit price is required")
        @PositiveOrZero(message = "Unit price must be non-negative")
        BigDecimal unitPrice,

        @NotNull(message = "Quantity on hand is required")
        @PositiveOrZero(message = "Quantity must be non-negative")
        BigDecimal quantityOnHand,

        String unitOfMeasure,
        UUID categoryId,
        UUID unitId,
        UUID taxRateId,
        Boolean active
) {
}
