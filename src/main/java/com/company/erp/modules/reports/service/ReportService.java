package com.company.erp.modules.reports.service;

import com.company.erp.modules.reports.dto.AgedReportResponse;
import com.company.erp.modules.reports.dto.BalanceSheetReportResponse;
import com.company.erp.modules.reports.dto.ProfitAndLossReportResponse;

import java.time.LocalDate;

public interface ReportService {
    ProfitAndLossReportResponse getProfitAndLoss(LocalDate fromDate, LocalDate toDate);
    BalanceSheetReportResponse getBalanceSheet(LocalDate asOfDate);
    AgedReportResponse getAgedReceivables(LocalDate asOfDate);
    AgedReportResponse getAgedPayables(LocalDate asOfDate);
}
