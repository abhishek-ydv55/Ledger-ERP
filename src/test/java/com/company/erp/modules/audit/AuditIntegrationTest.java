package com.company.erp.modules.audit;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.dto.JournalEntryResponse;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.service.JournalEntryService;
import com.company.erp.modules.audit.dto.AuditLogResponse;
import com.company.erp.modules.audit.service.AuditService;
import com.company.erp.modules.banking.dto.BankAccountRequest;
import com.company.erp.modules.banking.dto.BankAccountResponse;
import com.company.erp.modules.banking.service.BankAccountService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.entity.PartyRole;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.payments.entity.PaymentMethod;
import com.company.erp.modules.payments.dto.PaymentReceivedRequest;
import com.company.erp.modules.payments.dto.PaymentReceivedResponse;
import com.company.erp.modules.payments.service.PaymentReceivedService;
import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.dto.PurchaseItemRequest;
import com.company.erp.modules.purchases.service.BillService;
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
public class AuditIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private BillService billService;

    @Autowired
    private PaymentReceivedService paymentReceivedService;

    @Autowired
    private JournalEntryService journalEntryService;

    @Autowired
    private BankAccountService bankAccountService;

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
    private BankAccountResponse bankAccount;

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

        customer = new Party("Acme Corp", "CUST-AUD", "cust@acme.com", "555-0101", "TAX-01", true);
        customer.setOrganizationId(tenantId);
        customer.setRoles(Set.of(PartyRole.CUSTOMER));
        customer = partyRepository.save(customer);

        vendor = new Party("Global Supplies", "VEND-AUD", "vend@global.com", "555-0202", "TAX-02", true);
        vendor.setOrganizationId(tenantId);
        vendor.setRoles(Set.of(PartyRole.VENDOR));
        vendor = partyRepository.save(vendor);

        item = new Item("Widget", "WDG-AUD", "Description", new BigDecimal("50.00"), new BigDecimal("100.00"), "PCS");
        item.setOrganizationId(tenantId);
        item = itemRepository.save(item);

        bankAccount = bankAccountService.createBankAccount(new BankAccountRequest(
                "Main Checking", "ACC-AUD-1", "First National Bank", "USD", new BigDecimal("1000.00"), true
        ));
    }

    @Test
    @DisplayName("Issuing an invoice should record an audit log with action ISSUE")
    void testInvoiceIssueAuditRecorded() {
        InvoiceResponse invoice = invoiceService.createInvoice(new InvoiceRequest(
                customer.getId(), null, null, "INV-AUD-1", LocalDate.now(), LocalDate.now().plusDays(30), "Audit test invoice",
                List.of(new SalesItemRequest(item.getId(), "Widget", new BigDecimal("1.0"), new BigDecimal("100.00"), BigDecimal.ZERO))
        ));

        invoiceService.issueInvoice(invoice.id());

        List<AuditLogResponse> logs = auditService.getLogsByEntity("INVOICE", invoice.id());
        assertThat(logs).hasSize(1);
        AuditLogResponse log = logs.get(0);
        assertThat(log.action()).isEqualTo("ISSUE");
        assertThat(log.newSnapshot()).contains("INV-AUD-1");
    }

    @Test
    @DisplayName("Recording a bill should record an audit log with action RECORD")
    void testBillRecordAuditRecorded() {
        BillResponse bill = billService.createBill(new BillRequest(
                vendor.getId(), null, null, "BILL-AUD-1", LocalDate.now(), LocalDate.now().plusDays(30), "Audit test bill",
                List.of(new PurchaseItemRequest(item.getId(), "Widget", new BigDecimal("2.0"), new BigDecimal("50.00"), BigDecimal.ZERO))
        ));

        billService.recordBill(bill.id());

        List<AuditLogResponse> logs = auditService.getLogsByEntity("BILL", bill.id());
        assertThat(logs).hasSize(1);
        AuditLogResponse log = logs.get(0);
        assertThat(log.action()).isEqualTo("RECORD");
        assertThat(log.newSnapshot()).contains("BILL-AUD-1");
    }

    @Test
    @DisplayName("Allocating a payment received should record an audit log with action ALLOCATE")
    void testPaymentAllocationAuditRecorded() {
        InvoiceResponse invoice = invoiceService.createInvoice(new InvoiceRequest(
                customer.getId(), null, null, "INV-AUD-2", LocalDate.now(), LocalDate.now().plusDays(30), "Invoice for allocation audit",
                List.of(new SalesItemRequest(item.getId(), "Widget", new BigDecimal("1.0"), new BigDecimal("100.00"), BigDecimal.ZERO))
        ));
        invoice = invoiceService.issueInvoice(invoice.id());

        PaymentReceivedResponse payment = paymentReceivedService.createPaymentReceived(new PaymentReceivedRequest(
                customer.getId(), bankAccount.id(), "PAY-AUD-1", LocalDate.now(), com.company.erp.modules.payments.entity.PaymentMethod.BANK_TRANSFER,
                new BigDecimal("100.00"), "REF-AUD", "Payment audit"
        ));

        paymentReceivedService.allocate(payment.id(), invoice.id(), new BigDecimal("100.00"), LocalDate.now());

        List<AuditLogResponse> logs = auditService.getLogsByEntity("PAYMENT_RECEIVED", payment.id());
        assertThat(logs).hasSize(1);
        AuditLogResponse log = logs.get(0);
        assertThat(log.action()).isEqualTo("ALLOCATE");
        assertThat(log.newSnapshot()).contains("100.00");
    }

    @Test
    @DisplayName("Posting a journal entry should record an audit log with action POST")
    void testJournalEntryPostAuditRecorded() {
        Account asset = new Account("1001", "Cash", AccountType.ASSET, null, true, false);
        asset.setOrganizationId(tenantId);
        asset = accountRepository.save(asset);

        Account equity = new Account("3001", "Capital", AccountType.EQUITY, null, true, false);
        equity.setOrganizationId(tenantId);
        equity = accountRepository.save(equity);

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-AUD-1", LocalDate.now(), "Opening capital", "MANUAL", null,
                List.of(
                        new JournalEntryLineDraft(asset.getId(), new BigDecimal("1000.00"), BigDecimal.ZERO, "Debit Cash"),
                        new JournalEntryLineDraft(equity.getId(), BigDecimal.ZERO, new BigDecimal("1000.00"), "Credit Capital")
                )
        );

        JournalEntryResponse posted = journalEntryService.post(draft);

        List<AuditLogResponse> logs = auditService.getLogsByEntity("JOURNAL_ENTRY", posted.id());
        assertThat(logs).hasSize(1);
        AuditLogResponse log = logs.get(0);
        assertThat(log.action()).isEqualTo("POST");
        assertThat(log.newSnapshot()).contains("JE-AUD-1");
    }
}
