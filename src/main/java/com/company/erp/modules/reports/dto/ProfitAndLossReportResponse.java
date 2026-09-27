package com.company.erp.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProfitAndLossReportResponse(
        LocalDate fromDate,
        LocalDate toDate,
        List<AccountSummaryDto> revenues,
        BigDecimal totalRevenue,
        List<AccountSummaryDto> expenses,
        BigDecimal totalExpense,
        BigDecimal netProfit
) {
}
