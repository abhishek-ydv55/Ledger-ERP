package com.company.erp.modules.sales.dto;

import com.company.erp.modules.sales.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        UUID organizationId,
        UUID customerId,
        String customerName,
        UUID salesOrderId,
        UUID warehouseId,
        String warehouseName,
        String invoiceNumber,
        LocalDate invoiceDate,
        LocalDate dueDate,
        InvoiceStatus status,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal balanceDue,
        String notes,
        List<SalesItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
