package com.company.erp.modules.items.dto;

import jakarta.validation.constraints.NotBlank;

public record ItemCategoryRequest(
        @NotBlank(message = "Category name is required")
        String name,
        String code,
        String description
) {
}
