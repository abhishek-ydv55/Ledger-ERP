package com.company.erp.modules.sales.dto;

import com.company.erp.modules.sales.entity.EstimateStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EstimateResponse(
        UUID id,
        UUID organizationId,
        UUID customerId,
        String customerName,
        String estimateNumber,
        LocalDate estimateDate,
        LocalDate expirationDate,
        EstimateStatus status,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String notes,
        List<SalesItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
