package com.company.erp.modules.banking.dto;

import com.company.erp.modules.banking.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BankTransactionResponse(
        UUID id,
        UUID organizationId,
        UUID bankAccountId,
        String bankAccountName,
        LocalDate transactionDate,
        BigDecimal amount,
        TransactionType transactionType,
        String referenceNumber,
        String description,
        String sourceType,
        UUID sourceId,
        Instant createdAt,
        Instant updatedAt
) {
}
