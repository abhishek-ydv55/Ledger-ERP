package com.company.erp.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record StockTransferRequest(
        @NotBlank(message = "Transfer number is required")
        String transferNumber,

        @NotNull(message = "Source warehouse ID is required")
        UUID sourceWarehouseId,

        @NotNull(message = "Destination warehouse ID is required")
        UUID destinationWarehouseId,

        String notes,

        @NotEmpty(message = "Stock transfer must contain at least one item")
        List<StockTransferItemRequest> items
) {
}
