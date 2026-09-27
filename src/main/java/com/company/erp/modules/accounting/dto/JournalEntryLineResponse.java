package com.company.erp.modules.accounting.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record JournalEntryLineResponse(
        UUID id,
        UUID accountId,
        String accountCode,
        String accountName,
        BigDecimal debit,
        BigDecimal credit,
        String memo
) {
}
