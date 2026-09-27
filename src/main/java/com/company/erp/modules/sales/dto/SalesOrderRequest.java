package com.company.erp.modules.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SalesOrderRequest(
        @NotNull(message = "Customer ID is required")
        UUID customerId,

        UUID estimateId,

        @NotBlank(message = "Order number is required")
        String orderNumber,

        @NotNull(message = "Order date is required")
        LocalDate orderDate,

        String notes,

        @NotEmpty(message = "Sales order must contain at least one item")
        List<SalesItemRequest> items
) {
}
