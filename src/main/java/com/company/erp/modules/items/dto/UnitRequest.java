package com.company.erp.modules.items.dto;

import jakarta.validation.constraints.NotBlank;

public record UnitRequest(
        @NotBlank(message = "Unit name is required")
        String name,
        @NotBlank(message = "Unit code is required")
        String code,
        String symbol
) {
}
