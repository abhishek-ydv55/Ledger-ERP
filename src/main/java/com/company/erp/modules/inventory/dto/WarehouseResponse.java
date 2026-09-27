package com.company.erp.modules.inventory.dto;

import java.time.Instant;
import java.util.UUID;

public record WarehouseResponse(
        UUID id,
        UUID organizationId,
        String name,
        String code,
        String location,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
