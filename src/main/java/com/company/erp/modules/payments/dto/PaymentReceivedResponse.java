package com.company.erp.modules.payments.dto;

import com.company.erp.modules.payments.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PaymentReceivedResponse(
        UUID id,
        UUID organizationId,
        UUID customerId,
        String customerName,
        UUID bankAccountId,
        String bankAccountName,
        String paymentNumber,
        LocalDate paymentDate,
        PaymentMethod paymentMethod,
        BigDecimal amount,
        BigDecimal unallocatedAmount,
        String referenceNumber,
        String notes,
        List<PaymentReceivedAllocationResponse> allocations,
        Instant createdAt,
        Instant updatedAt
) {
}
