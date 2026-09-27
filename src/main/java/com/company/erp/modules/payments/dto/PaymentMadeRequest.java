package com.company.erp.modules.payments.dto;

import com.company.erp.modules.payments.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentMadeRequest(
        @NotNull(message = "Vendor ID is required") UUID vendorId,
        UUID bankAccountId,
        @NotBlank(message = "Payment number is required") String paymentNumber,
        @NotNull(message = "Payment date is required") LocalDate paymentDate,
        @NotNull(message = "Payment method is required") PaymentMethod paymentMethod,
        @NotNull(message = "Amount is required") BigDecimal amount,
        String referenceNumber,
        String notes
) {
}
