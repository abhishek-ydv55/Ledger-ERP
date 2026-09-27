package com.company.erp.modules.items.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record TaxRateRequest(
        @NotBlank(message = "Tax rate name is required")
        String name,
        @NotNull(message = "Tax rate is required")
        @PositiveOrZero(message = "Tax rate must be non-negative")
        BigDecimal rate,
        String code,
        Boolean active
) {
}
