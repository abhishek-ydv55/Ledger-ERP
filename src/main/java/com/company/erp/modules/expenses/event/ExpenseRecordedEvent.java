package com.company.erp.modules.expenses.event;

import com.company.erp.modules.expenses.entity.ExpensePaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseRecordedEvent(
        UUID expenseId,
        UUID organizationId,
        UUID categoryId,
        String categoryName,
        UUID vendorId,
        UUID bankAccountId,
        BigDecimal amount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        ExpensePaymentStatus paymentStatus,
        LocalDate expenseDate,
        String expenseNumber,
        String referenceNumber,
        String description
) {
}
