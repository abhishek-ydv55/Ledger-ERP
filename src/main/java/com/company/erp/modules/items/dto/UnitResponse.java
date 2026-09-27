package com.company.erp.modules.items.dto;

import java.time.Instant;
import java.util.UUID;

public record UnitResponse(
        UUID id,
        UUID organizationId,
        String name,
        String code,
        String symbol,
        Instant createdAt,
        Instant updatedAt
) {
}
