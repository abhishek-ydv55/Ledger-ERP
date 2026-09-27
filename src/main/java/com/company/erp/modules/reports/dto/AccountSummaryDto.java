package com.company.erp.modules.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountSummaryDto(
        UUID accountId,
        String accountCode,
        String accountName,
        String accountType,
        BigDecimal netAmount
) {
}
