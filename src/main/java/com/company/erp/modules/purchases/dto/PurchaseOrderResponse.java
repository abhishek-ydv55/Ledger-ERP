package com.company.erp.modules.purchases.dto;

import com.company.erp.modules.purchases.entity.PurchaseOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id,
        UUID organizationId,
        UUID vendorId,
        String vendorName,
        String orderNumber,
        LocalDate orderDate,
        LocalDate expectedDeliveryDate,
        PurchaseOrderStatus status,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String notes,
        List<PurchaseItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
