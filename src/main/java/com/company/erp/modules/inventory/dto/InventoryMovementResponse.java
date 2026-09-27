package com.company.erp.modules.inventory.dto;

import com.company.erp.modules.inventory.entity.MovementType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InventoryMovementResponse(
        UUID id,
        UUID organizationId,
        UUID warehouseId,
        UUID itemId,
        BigDecimal quantityDelta,
        MovementType movementType,
        String sourceType,
        UUID sourceId,
        Instant createdAt
) {
}
