package com.company.erp.modules.purchases.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BillRequest(
        @NotNull(message = "Vendor ID is required")
        UUID vendorId,

        UUID purchaseOrderId,
        UUID warehouseId,

        @NotBlank(message = "Bill number is required")
        String billNumber,

        @NotNull(message = "Bill date is required")
        LocalDate billDate,

        LocalDate dueDate,
        String notes,

        @NotEmpty(message = "Bill must contain at least one item")
        List<PurchaseItemRequest> items
) {
}
