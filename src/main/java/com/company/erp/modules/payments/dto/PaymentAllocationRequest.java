package com.company.erp.modules.payments.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentAllocationRequest(
        @NotNull(message = "Payment ID is required") UUID paymentId,
        UUID invoiceId,
        UUID billId,
        @NotNull(message = "Amount is required") BigDecimal amount,
        LocalDate allocationDate
) {
}
