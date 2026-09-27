package com.company.erp.modules.expenses.dto;

import jakarta.validation.constraints.NotBlank;

public record ExpenseCategoryRequest(
        @NotBlank(message = "Category name is required") String name,
        String code,
        String description,
        Boolean active
) {
}
