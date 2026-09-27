package com.company.erp.modules.sales.dto;

import com.company.erp.modules.sales.entity.SalesOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SalesOrderResponse(
        UUID id,
        UUID organizationId,
        UUID customerId,
        String customerName,
        UUID estimateId,
        String orderNumber,
        LocalDate orderDate,
        SalesOrderStatus status,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String notes,
        List<SalesItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
