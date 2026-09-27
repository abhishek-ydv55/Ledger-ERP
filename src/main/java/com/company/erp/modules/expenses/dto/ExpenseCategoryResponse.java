package com.company.erp.modules.expenses.dto;

import java.time.Instant;
import java.util.UUID;

public record ExpenseCategoryResponse(
        UUID id,
        UUID organizationId,
        String name,
        String code,
        String description,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
