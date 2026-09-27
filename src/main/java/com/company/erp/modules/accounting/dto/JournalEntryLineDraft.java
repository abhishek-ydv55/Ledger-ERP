package com.company.erp.modules.accounting.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record JournalEntryLineDraft(
        @NotNull(message = "Account ID is required")
        UUID accountId,

        BigDecimal debit,
        BigDecimal credit,
        String memo
) {
}
