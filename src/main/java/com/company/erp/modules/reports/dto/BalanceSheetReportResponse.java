package com.company.erp.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BalanceSheetReportResponse(
        LocalDate asOfDate,
        List<AccountSummaryDto> assets,
        BigDecimal totalAssets,
        List<AccountSummaryDto> liabilities,
        BigDecimal totalLiabilities,
        List<AccountSummaryDto> equity,
        BigDecimal totalEquity,
        BigDecimal totalLiabilitiesAndEquity
) {
}
