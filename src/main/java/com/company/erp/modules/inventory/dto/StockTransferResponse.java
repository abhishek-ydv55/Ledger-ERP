package com.company.erp.modules.inventory.dto;

import com.company.erp.modules.inventory.entity.StockTransferStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StockTransferResponse(
        UUID id,
        UUID organizationId,
        String transferNumber,
        UUID sourceWarehouseId,
        String sourceWarehouseName,
        UUID destinationWarehouseId,
        String destinationWarehouseName,
        StockTransferStatus status,
        String notes,
        List<StockTransferItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
