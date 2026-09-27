package com.company.erp.modules.items.dto;

import java.time.Instant;
import java.util.UUID;

public record ItemCategoryResponse(
        UUID id,
        UUID organizationId,
        String name,
        String code,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}
