package com.company.erp.modules.expenses.dto;

import com.company.erp.modules.expenses.entity.ExpensePaymentStatus;
import com.company.erp.modules.payments.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseRequest(
        @NotNull(message = "Category ID is required") UUID categoryId,
        UUID vendorId,
        UUID bankAccountId,
        @NotBlank(message = "Expense number is required") String expenseNumber,
        @NotNull(message = "Expense date is required") LocalDate expenseDate,
        @NotNull(message = "Amount is required") BigDecimal amount,
        BigDecimal taxAmount,
        ExpensePaymentStatus paymentStatus,
        PaymentMethod paymentMethod,
        String referenceNumber,
        String description
) {
}
