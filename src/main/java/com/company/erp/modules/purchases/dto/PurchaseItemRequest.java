package com.company.erp.modules.purchases.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemRequest(
        @NotNull(message = "Item ID is required")
        UUID itemId,

        String description,

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        BigDecimal quantity,

        @NotNull(message = "Unit price is required")
        BigDecimal unitPrice,

        BigDecimal taxRate
) {
}
