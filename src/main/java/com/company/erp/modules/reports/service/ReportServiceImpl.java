package com.company.erp.modules.reports.service;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.reports.dto.AccountSummaryDto;
import com.company.erp.modules.reports.dto.AgedReportItemDto;
import com.company.erp.modules.reports.dto.AgedReportResponse;
import com.company.erp.modules.reports.dto.BalanceSheetReportResponse;
import com.company.erp.modules.reports.dto.ProfitAndLossReportResponse;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ReportServiceImpl(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public ProfitAndLossReportResponse getProfitAndLoss(LocalDate fromDate, LocalDate toDate) {
        UUID orgId = TenantContext.getTenantId();
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("fromDate", fromDate)
                .addValue("toDate", toDate);

        String sql = """
            SELECT 
                a.id AS account_id,
                a.code AS account_code,
                a.name AS account_name,
                a.type AS account_type,
                COALESCE(SUM(l.debit), 0) AS total_debit,
                COALESCE(SUM(l.credit), 0) AS total_credit
            FROM chart_of_accounts a
            JOIN journal_entry_lines l ON l.account_id = a.id
            JOIN journal_entries e ON e.id = l.journal_entry_id
            WHERE e.organization_id = :orgId
              AND e.status = 'POSTED'
              AND a.type IN ('REVENUE', 'EXPENSE')
              AND (:fromDate IS NULL OR e.entry_date >= :fromDate)
              AND (:toDate IS NULL OR e.entry_date <= :toDate)
            GROUP BY a.id, a.code, a.name, a.type
            ORDER BY a.code
            """;

        List<AccountSummaryDto> revenues = new ArrayList<>();
        List<AccountSummaryDto> expenses = new ArrayList<>();

        jdbcTemplate.query(sql, params, rs -> {
            UUID accountId = (UUID) rs.getObject("account_id");
            String code = rs.getString("account_code");
            String name = rs.getString("account_name");
            String type = rs.getString("account_type");
            BigDecimal debit = rs.getBigDecimal("total_debit");
            BigDecimal credit = rs.getBigDecimal("total_credit");

            if ("REVENUE".equalsIgnoreCase(type)) {
                BigDecimal net = credit.subtract(debit);
                revenues.add(new AccountSummaryDto(accountId, code, name, type, net));
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                BigDecimal net = debit.subtract(credit);
                expenses.add(new AccountSummaryDto(accountId, code, name, type, net));
            }
        });

        BigDecimal totalRevenue = revenues.stream()
                .map(AccountSummaryDto::netAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = expenses.stream()
                .map(AccountSummaryDto::netAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = totalRevenue.subtract(totalExpense);

        return new ProfitAndLossReportResponse(fromDate, toDate, revenues, totalRevenue, expenses, totalExpense, netProfit);
    }

    @Override
    public BalanceSheetReportResponse getBalanceSheet(LocalDate asOfDate) {
        UUID orgId = TenantContext.getTenantId();
        LocalDate asOf = asOfDate != null ? asOfDate : LocalDate.now();

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", orgId)
                .addValue("asOfDate", asOf);

        String sql = """
            SELECT 
                a.id AS account_id,
                a.code AS account_code,
                a.name AS account_name,
                a.type AS account_type,
                COALESCE(SUM(l.debit), 0) AS total_debit,
                COALESCE(SUM(l.credit), 0) AS total_credit
            FROM chart_of_accounts a
            JOIN journal_entry_lines l ON l.account_id = a.id
            JOIN journal_entries e ON e.id = l.journal_entry_id
            WHERE e.organization_id = :orgId
              AND e.status = 'POSTED'
              AND (:asOfDate IS NULL OR e.entry_date <= :asOfDate)
            GROUP BY a.id, a.code, a.name, a.type
            ORDER BY a.code
            """;

        List<AccountSummaryDto> assets = new ArrayList<>();
        List<AccountSummaryDto> liabilities = new ArrayList<>();
        List<AccountSummaryDto> equity = new ArrayList<>();

        final BigDecimal[] netRetainedRevenue = {BigDecimal.ZERO};
        final BigDecimal[] netRetainedExpense = {BigDecimal.ZERO};

        jdbcTemplate.query(sql, params, rs -> {
            UUID accountId = (UUID) rs.getObject("account_id");
            String code = rs.getString("account_code");
            String name = rs.getString("account_name");
            String type = rs.getString("account_type");
            BigDecimal debit = rs.getBigDecimal("total_debit");
            BigDecimal credit = rs.getBigDecimal("total_credit");

            if ("ASSET".equalsIgnoreCase(type)) {
                BigDecimal net = debit.subtract(credit);
                assets.add(new AccountSummaryDto(accountId, code, name, type, net));
            } else if ("LIABILITY".equalsIgnoreCase(type)) {
                BigDecimal net = credit.subtract(debit);
                liabilities.add(new AccountSummaryDto(accountId, code, name, type, net));
            } else if ("EQUITY".equalsIgnoreCase(type)) {
                BigDecimal net = credit.subtract(debit);
                equity.add(new AccountSummaryDto(accountId, code, name, type, net));
            } else if ("REVENUE".equalsIgnoreCase(type)) {
                netRetainedRevenue[0] = netRetainedRevenue[0].add(credit.subtract(debit));
            } else if ("EXPENSE".equalsIgnoreCase(type)) {
                netRetainedExpense[0] = netRetainedExpense[0].add(debit.subtract(credit));
            }
        });

        BigDecimal totalAssets = assets.stream().map(AccountSummaryDto::netAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLiabilities = liabilities.stream().map(AccountSummaryDto::netAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEquity = equity.stream().map(AccountSummaryDto::netAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal retainedEarnings = netRetainedRevenue[0].subtract(netRetainedExpense[0]);
        equity.add(new AccountSummaryDto(null, "RETAINED_EARNINGS", "Retained Earnings", "EQUITY", retainedEarnings));
        totalEquity = totalEquity.add(retainedEarnings);

        BigDecimal totalLiabilitiesAndEquity = totalLiabilities.add(totalEquity);

        return new BalanceSheetReportResponse(asOf, assets, totalAssets, liabilities, totalLiabilities, equity, totalEquity, totalLiabilitiesAndEquity);
    }

    @Override
    public AgedReportResponse getAgedReceivables(LocalDate asOfDate) {
        UUID orgId = TenantContext.getTenantId();
        LocalDate asOf = asOfDate != null ? asOfDate : LocalDate.now();

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", orgId);

        String sql = """
            SELECT 
                i.id AS entity_id,
                i.invoice_number AS document_number,
                i.customer_id AS party_id,
                p.name AS party_name,
                i.invoice_date AS document_date,
                i.due_date AS due_date,
                i.total_amount AS total_amount,
                i.amount_paid AS amount_paid,
                i.balance_due AS balance_due
            FROM invoices i
            JOIN parties p ON p.id = i.customer_id
            WHERE i.organization_id = :orgId
              AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
              AND i.balance_due > 0
            ORDER BY p.name, i.due_date
            """;

        return buildAgedReport(sql, params, asOf);
    }

    @Override
    public AgedReportResponse getAgedPayables(LocalDate asOfDate) {
        UUID orgId = TenantContext.getTenantId();
        LocalDate asOf = asOfDate != null ? asOfDate : LocalDate.now();

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orgId", orgId);

        String sql = """
            SELECT 
                b.id AS entity_id,
                b.bill_number AS document_number,
                b.vendor_id AS party_id,
                p.name AS party_name,
                b.bill_date AS document_date,
                b.due_date AS due_date,
                b.total_amount AS total_amount,
                b.amount_paid AS amount_paid,
                b.balance_due AS balance_due
            FROM bills b
            JOIN parties p ON p.id = b.vendor_id
            WHERE b.organization_id = :orgId
              AND b.status IN ('RECORDED', 'PARTIALLY_PAID')
              AND b.balance_due > 0
            ORDER BY p.name, b.due_date
            """;

        return buildAgedReport(sql, params, asOf);
    }

    private AgedReportResponse buildAgedReport(String sql, MapSqlParameterSource params, LocalDate asOf) {
        List<AgedReportItemDto> items = new ArrayList<>();
        BigDecimal currentTotal = BigDecimal.ZERO;
        BigDecimal days1To30Total = BigDecimal.ZERO;
        BigDecimal days31To60Total = BigDecimal.ZERO;
        BigDecimal days61To90Total = BigDecimal.ZERO;
        BigDecimal over90Total = BigDecimal.ZERO;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params);
        for (Map<String, Object> row : rows) {
            UUID entityId = (UUID) row.get("entity_id");
            String docNum = (String) row.get("document_number");
            UUID partyId = (UUID) row.get("party_id");
            String partyName = (String) row.get("party_name");

            Object docDateObj = row.get("document_date");
            LocalDate docDate = docDateObj instanceof Date d ? d.toLocalDate() : (LocalDate) docDateObj;

            Object dueDateObj = row.get("due_date");
            LocalDate dueDate = dueDateObj instanceof Date d ? d.toLocalDate() : (LocalDate) dueDateObj;

            BigDecimal totalAmount = (BigDecimal) row.get("total_amount");
            BigDecimal amountPaid = (BigDecimal) row.get("amount_paid");
            BigDecimal balanceDue = (BigDecimal) row.get("balance_due");

            long daysOverdue = 0;
            if (asOf.isAfter(dueDate)) {
                daysOverdue = ChronoUnit.DAYS.between(dueDate, asOf);
            }

            String bucket;
            if (daysOverdue <= 0) {
                bucket = "CURRENT";
                currentTotal = currentTotal.add(balanceDue);
            } else if (daysOverdue <= 30) {
                bucket = "1_30";
                days1To30Total = days1To30Total.add(balanceDue);
            } else if (daysOverdue <= 60) {
                bucket = "31_60";
                days31To60Total = days31To60Total.add(balanceDue);
            } else if (daysOverdue <= 90) {
                bucket = "61_90";
                days61To90Total = days61To90Total.add(balanceDue);
            } else {
                bucket = "OVER_90";
                over90Total = over90Total.add(balanceDue);
            }

            items.add(new AgedReportItemDto(
                    entityId, docNum, partyId, partyName, docDate, dueDate, totalAmount, amountPaid, balanceDue, daysOverdue, bucket
            ));
        }

        BigDecimal grandTotal = currentTotal.add(days1To30Total).add(days31To60Total).add(days61To90Total).add(over90Total);
        return new AgedReportResponse(asOf, items, currentTotal, days1To30Total, days31To60Total, days61To90Total, over90Total, grandTotal);
    }
}
