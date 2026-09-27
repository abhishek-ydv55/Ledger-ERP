package com.company.erp.modules.reports.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.reports.dto.AgedReportResponse;
import com.company.erp.modules.reports.dto.BalanceSheetReportResponse;
import com.company.erp.modules.reports.dto.ProfitAndLossReportResponse;
import com.company.erp.modules.reports.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/reports", "/api/v1/reports"})
@Tag(name = "Reports", description = "Financial Statements & Analytics Reporting API")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/profit-and-loss")
    @Operation(summary = "Get Profit and Loss report statement")
    public ResponseEntity<ApiResponse<ProfitAndLossReportResponse>> getProfitAndLoss(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        ProfitAndLossReportResponse report = reportService.getProfitAndLoss(from, to);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/balance-sheet")
    @Operation(summary = "Get Balance Sheet report statement")
    public ResponseEntity<ApiResponse<BalanceSheetReportResponse>> getBalanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf
    ) {
        BalanceSheetReportResponse report = reportService.getBalanceSheet(asOf);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/aged-receivables")
    @Operation(summary = "Get Aged Receivables report statement")
    public ResponseEntity<ApiResponse<AgedReportResponse>> getAgedReceivables(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf
    ) {
        AgedReportResponse report = reportService.getAgedReceivables(asOf);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/aged-payables")
    @Operation(summary = "Get Aged Payables report statement")
    public ResponseEntity<ApiResponse<AgedReportResponse>> getAgedPayables(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf
    ) {
        AgedReportResponse report = reportService.getAgedPayables(asOf);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
