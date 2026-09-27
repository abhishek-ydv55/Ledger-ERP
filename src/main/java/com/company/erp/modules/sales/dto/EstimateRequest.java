package com.company.erp.modules.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EstimateRequest(
        @NotNull(message = "Customer ID is required")
        UUID customerId,

        @NotBlank(message = "Estimate number is required")
        String estimateNumber,

        @NotNull(message = "Estimate date is required")
        LocalDate estimateDate,

        LocalDate expirationDate,
        String notes,

        @NotEmpty(message = "Estimate must contain at least one item")
        List<SalesItemRequest> items
) {
}
