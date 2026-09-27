package com.company.erp.modules.banking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BankAccountResponse(
        UUID id,
        UUID organizationId,
        String accountName,
        String accountNumber,
        String bankName,
        String currency,
        BigDecimal openingBalance,
        BigDecimal currentBalance,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
