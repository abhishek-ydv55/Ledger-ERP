package com.company.erp.modules.purchases.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderRequest(
        @NotNull(message = "Vendor ID is required")
        UUID vendorId,

        @NotBlank(message = "Order number is required")
        String orderNumber,

        @NotNull(message = "Order date is required")
        LocalDate orderDate,

        LocalDate expectedDeliveryDate,
        String notes,

        @NotEmpty(message = "Purchase order must contain at least one item")
        List<PurchaseItemRequest> items
) {
}
