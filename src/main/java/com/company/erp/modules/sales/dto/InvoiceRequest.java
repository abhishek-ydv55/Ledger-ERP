package com.company.erp.modules.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record InvoiceRequest(
        @NotNull(message = "Customer ID is required")
        UUID customerId,

        UUID salesOrderId,
        UUID warehouseId,

        @NotBlank(message = "Invoice number is required")
        String invoiceNumber,

        @NotNull(message = "Invoice date is required")
        LocalDate invoiceDate,

        LocalDate dueDate,
        String notes,

        @NotEmpty(message = "Invoice must contain at least one item")
        List<SalesItemRequest> items
) {
}
