package com.company.erp.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;

public record WarehouseRequest(
        @NotBlank(message = "Warehouse name is required")
        String name,
        @NotBlank(message = "Warehouse code is required")
        String code,
        String location,
        Boolean active
) {
}
