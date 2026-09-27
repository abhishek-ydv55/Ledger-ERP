package com.company.erp.modules.reports;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.service.JournalEntryService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.entity.PartyRole;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.dto.PurchaseItemRequest;
import com.company.erp.modules.purchases.service.BillService;
import com.company.erp.modules.reports.dto.AgedReportResponse;
import com.company.erp.modules.reports.dto.BalanceSheetReportResponse;
import com.company.erp.modules.reports.dto.ProfitAndLossReportResponse;
import com.company.erp.modules.reports.service.ReportService;
import com.company.erp.modules.sales.dto.InvoiceRequest;
import com.company.erp.modules.sales.dto.InvoiceResponse;
import com.company.erp.modules.sales.dto.SalesItemRequest;
import com.company.erp.modules.sales.service.InvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureMockMvc(addFilters = false)
public class ReportsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private JournalEntryService journalEntryService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private BillService billService;

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private Party customer;
    private Party vendor;
    private Item item;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM audit_logs");
        jdbcTemplate.execute("DELETE FROM payment_received_allocations");
        jdbcTemplate.execute("DELETE FROM payments_received");
        jdbcTemplate.execute("DELETE FROM payment_made_allocations");
        jdbcTemplate.execute("DELETE FROM payments_made");
        jdbcTemplate.execute("DELETE FROM bank_transactions");
        jdbcTemplate.execute("DELETE FROM bank_accounts");
        jdbcTemplate.execute("DELETE FROM journal_entry_lines");
        jdbcTemplate.execute("DELETE FROM journal_entries");
        jdbcTemplate.execute("DELETE FROM invoice_items");
        jdbcTemplate.execute("DELETE FROM invoices");
        jdbcTemplate.execute("DELETE FROM bill_items");
        jdbcTemplate.execute("DELETE FROM bills");
        jdbcTemplate.execute("DELETE FROM party_roles");
        jdbcTemplate.execute("DELETE FROM party_contacts");
        jdbcTemplate.execute("DELETE FROM party_addresses");
        jdbcTemplate.execute("DELETE FROM parties");
        jdbcTemplate.execute("DELETE FROM items");
        jdbcTemplate.execute("DELETE FROM chart_of_accounts");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenantId, "Test Tenant", "TENANT_1", true
        );

        TenantContext.setTenantId(tenantId);

        customer = new Party("Acme Corp", "CUST-REP", "cust@acme.com", "555-0101", "TAX-01", true);
        customer.setOrganizationId(tenantId);
        customer.setRoles(Set.of(PartyRole.CUSTOMER));
        customer = partyRepository.save(customer);

        vendor = new Party("Global Supplies", "VEND-REP", "vend@global.com", "555-0202", "TAX-02", true);
        vendor.setOrganizationId(tenantId);
        vendor.setRoles(Set.of(PartyRole.VENDOR));
        vendor = partyRepository.save(vendor);

        item = new Item("Widget", "WDG-REP", "Description", new BigDecimal("50.00"), new BigDecimal("100.00"), "PCS");
        item.setOrganizationId(tenantId);
        item = itemRepository.save(item);
    }

    @Test
    @DisplayName("Profit and Loss report should correctly sum revenues and expenses")
    void testProfitAndLossReport() {
        Account rev = new Account("4000", "Sales Revenue", AccountType.REVENUE, null, true, false);
        rev.setOrganizationId(tenantId);
        rev = accountRepository.save(rev);

        Account exp = new Account("5000", "Operating Expense", AccountType.EXPENSE, null, true, false);
        exp.setOrganizationId(tenantId);
        exp = accountRepository.save(exp);

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-PNL-1", LocalDate.now(), "Sales and Expense transaction", "MANUAL", null,
                List.of(
                        new JournalEntryLineDraft(exp.getId(), new BigDecimal("200.00"), BigDecimal.ZERO, "Expense debit"),
                        new JournalEntryLineDraft(rev.getId(), BigDecimal.ZERO, new BigDecimal("500.00"), "Revenue credit"),
                        new JournalEntryLineDraft(exp.getId(), new BigDecimal("300.00"), BigDecimal.ZERO, "Balancing debit")
                )
        );
        journalEntryService.post(draft);

        ProfitAndLossReportResponse pnl = reportService.getProfitAndLoss(LocalDate.now().minusDays(1), LocalDate.now().plusDays(1));

        assertThat(pnl).isNotNull();
        assertThat(pnl.totalRevenue()).isEqualByComparingTo("500.00");
        assertThat(pnl.totalExpense()).isEqualByComparingTo("500.00");
        assertThat(pnl.netProfit()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Balance Sheet report should correctly calculate assets, liabilities, and equity")
    void testBalanceSheetReport() {
        Account cash = new Account("1000", "Cash", AccountType.ASSET, null, true, false);
        cash.setOrganizationId(tenantId);
        cash = accountRepository.save(cash);

        Account equity = new Account("3000", "Owner Capital", AccountType.EQUITY, null, true, false);
        equity.setOrganizationId(tenantId);
        equity = accountRepository.save(equity);

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-BS-1", LocalDate.now(), "Capital injection", "MANUAL", null,
                List.of(
                        new JournalEntryLineDraft(cash.getId(), new BigDecimal("1000.00"), BigDecimal.ZERO, "Debit Cash"),
                        new JournalEntryLineDraft(equity.getId(), BigDecimal.ZERO, new BigDecimal("1000.00"), "Credit Capital")
                )
        );
        journalEntryService.post(draft);

        BalanceSheetReportResponse bs = reportService.getBalanceSheet(LocalDate.now());

        assertThat(bs).isNotNull();
        assertThat(bs.totalAssets()).isEqualByComparingTo("1000.00");
        assertThat(bs.totalLiabilitiesAndEquity()).isEqualByComparingTo("1000.00");
    }

    @Test
    @DisplayName("Aged Receivables report should properly bucket overdue invoices")
    void testAgedReceivablesReport() {
        LocalDate invoiceDate = LocalDate.now().minusDays(60);
        LocalDate dueDate = LocalDate.now().minusDays(45); // 45 days overdue -> 31_60 bucket

        InvoiceResponse invoice = invoiceService.createInvoice(new InvoiceRequest(
                customer.getId(), null, null, "INV-AGED-1", invoiceDate, dueDate, "Aged invoice test",
                List.of(new SalesItemRequest(item.getId(), "Widget", new BigDecimal("2.0"), new BigDecimal("100.00"), BigDecimal.ZERO))
        ));
        invoice = invoiceService.issueInvoice(invoice.id());

        AgedReportResponse report = reportService.getAgedReceivables(LocalDate.now());

        assertThat(report).isNotNull();
        assertThat(report.items()).hasSize(1);
        assertThat(report.items().get(0).daysOverdue()).isEqualTo(45);
        assertThat(report.items().get(0).bucket()).isEqualTo("31_60");
        assertThat(report.days31To60Total()).isEqualByComparingTo("200.00");
        assertThat(report.grandTotal()).isEqualByComparingTo("200.00");
    }

    @Test
    @DisplayName("Aged Payables report should properly bucket current and overdue bills")
    void testAgedPayablesReport() {
        LocalDate billDate = LocalDate.now();
        LocalDate dueDate = LocalDate.now().plusDays(30); // 0 days overdue -> CURRENT bucket

        BillResponse bill = billService.createBill(new BillRequest(
                vendor.getId(), null, null, "BILL-AGED-1", billDate, dueDate, "Aged bill test",
                List.of(new PurchaseItemRequest(item.getId(), "Widget", new BigDecimal("3.0"), new BigDecimal("50.00"), BigDecimal.ZERO))
        ));
        bill = billService.recordBill(bill.id());

        AgedReportResponse report = reportService.getAgedPayables(LocalDate.now());

        assertThat(report).isNotNull();
        assertThat(report.items()).hasSize(1);
        assertThat(report.items().get(0).daysOverdue()).isEqualTo(0);
        assertThat(report.items().get(0).bucket()).isEqualTo("CURRENT");
        assertThat(report.currentTotal()).isEqualByComparingTo("150.00");
        assertThat(report.grandTotal()).isEqualByComparingTo("150.00");
    }
}
