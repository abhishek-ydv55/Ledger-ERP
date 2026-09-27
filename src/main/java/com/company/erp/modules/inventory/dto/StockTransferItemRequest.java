package com.company.erp.modules.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record StockTransferItemRequest(
        @NotNull(message = "Item ID is required")
        UUID itemId,

        @NotNull(message = "Quantity is required")
        @Positive(message = "Transfer quantity must be positive")
        BigDecimal quantity
) {
}
