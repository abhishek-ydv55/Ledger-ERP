package com.company.erp.modules.payments.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentMadeAllocationResponse(
        UUID id,
        UUID paymentId,
        UUID billId,
        String billNumber,
        BigDecimal allocatedAmount,
        LocalDate allocationDate,
        Instant createdAt,
        Instant updatedAt
) {
}
