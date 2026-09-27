package com.company.erp.modules.expenses.dto;

import com.company.erp.modules.expenses.entity.ExpensePaymentStatus;
import com.company.erp.modules.payments.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        UUID organizationId,
        UUID categoryId,
        String categoryName,
        UUID vendorId,
        String vendorName,
        UUID bankAccountId,
        String bankAccountName,
        String expenseNumber,
        LocalDate expenseDate,
        BigDecimal amount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        ExpensePaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        String referenceNumber,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}
