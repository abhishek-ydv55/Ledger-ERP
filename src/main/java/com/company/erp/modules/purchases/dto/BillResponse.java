package com.company.erp.modules.purchases.dto;

import com.company.erp.modules.purchases.entity.BillStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BillResponse(
        UUID id,
        UUID organizationId,
        UUID vendorId,
        String vendorName,
        UUID purchaseOrderId,
        UUID warehouseId,
        String warehouseName,
        String billNumber,
        LocalDate billDate,
        LocalDate dueDate,
        BillStatus status,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal balanceDue,
        String notes,
        List<PurchaseItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
