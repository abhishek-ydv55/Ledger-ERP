package com.company.erp.modules.accounting.dto;

import com.company.erp.modules.accounting.entity.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AccountRequest(
        @NotBlank(message = "Account code is required")
        String code,

        @NotBlank(message = "Account name is required")
        String name,

        @NotNull(message = "Account type is required")
        AccountType accountType,

        UUID parentId,
        Boolean active,
        Boolean header
) {
}
