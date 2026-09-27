package com.company.erp.modules.payments.event;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentAllocatedEvent(
        UUID allocationId,
        String paymentType,
        UUID paymentId,
        String targetType,
        UUID targetId,
        UUID bankAccountId,
        BigDecimal amount,
        LocalDate allocationDate,
        UUID organizationId,
        String referenceNumber
) {
}
