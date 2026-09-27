package com.company.erp.modules.payments;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.dto.BankAccountRequest;
import com.company.erp.modules.banking.dto.BankAccountResponse;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.banking.service.BankAccountService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.entity.PartyRole;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.payments.dto.PaymentMadeAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentMadeRequest;
import com.company.erp.modules.payments.dto.PaymentMadeResponse;
import com.company.erp.modules.payments.dto.PaymentReceivedAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentReceivedRequest;
import com.company.erp.modules.payments.dto.PaymentReceivedResponse;
import com.company.erp.modules.payments.entity.PaymentMethod;
import com.company.erp.modules.payments.repository.PaymentReceivedAllocationRepository;
import com.company.erp.modules.payments.service.PaymentMadeService;
import com.company.erp.modules.payments.service.PaymentReceivedService;
import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.dto.PurchaseItemRequest;
import com.company.erp.modules.purchases.entity.BillStatus;
import com.company.erp.modules.purchases.service.BillService;
import com.company.erp.modules.sales.dto.InvoiceRequest;
import com.company.erp.modules.sales.dto.InvoiceResponse;
import com.company.erp.modules.sales.dto.SalesItemRequest;
import com.company.erp.modules.sales.entity.InvoiceStatus;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@AutoConfigureMockMvc(addFilters = false)
public class PaymentsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private PaymentReceivedService paymentReceivedService;

    @Autowired
    private PaymentMadeService paymentMadeService;

    @Autowired
    private BankAccountService bankAccountService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private BillService billService;

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private PaymentReceivedAllocationRepository paymentReceivedAllocationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private Party customer;
    private Party vendor;
    private Item item;
    private BankAccountResponse bankAccount;

    @BeforeEach
    void setUp() {
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

        customer = new Party("Acme Corp", "CUST-001", "cust@acme.com", "555-0101", "TAX-01", true);
        customer.setOrganizationId(tenantId);
        customer.setRoles(Set.of(PartyRole.CUSTOMER));
        customer = partyRepository.save(customer);

        vendor = new Party("Global Supplies", "VEND-001", "vend@global.com", "555-0202", "TAX-02", true);
        vendor.setOrganizationId(tenantId);
        vendor.setRoles(Set.of(PartyRole.VENDOR));
        vendor = partyRepository.save(vendor);

        item = new Item("Widget", "WDG-001", "Description", new BigDecimal("50.00"), new BigDecimal("100.00"), "PCS");
        item.setOrganizationId(tenantId);
        item = itemRepository.save(item);

        bankAccount = bankAccountService.createBankAccount(new BankAccountRequest(
                "Main Checking", "ACC-12345", "First National Bank", "USD", new BigDecimal("1000.00"), true
        ));
    }

    @Test
    @DisplayName("Should successfully create payment received, allocate against invoice, and publish events")
    void testPaymentReceivedAllocationSuccess() {
        InvoiceResponse invoice = invoiceService.createInvoice(new InvoiceRequest(
                customer.getId(), null, null, "INV-1001", LocalDate.now(), LocalDate.now().plusDays(30), "Note",
                List.of(new SalesItemRequest(item.getId(), "Widget", new BigDecimal("1.0"), new BigDecimal("100.00"), BigDecimal.ZERO))
        ));
        invoice = invoiceService.issueInvoice(invoice.id());

        PaymentReceivedResponse payment = paymentReceivedService.createPaymentReceived(new PaymentReceivedRequest(
                customer.getId(), bankAccount.id(), "PAY-REC-001", LocalDate.now(), PaymentMethod.BANK_TRANSFER,
                new BigDecimal("100.00"), "REF-100", "Received full payment"
        ));

        PaymentReceivedAllocationResponse allocation = paymentReceivedService.allocate(
                payment.id(), invoice.id(), new BigDecimal("100.00"), LocalDate.now()
        );

        assertThat(allocation).isNotNull();
        assertThat(allocation.allocatedAmount()).isEqualByComparingTo("100.00");

        InvoiceResponse updatedInvoice = invoiceService.getInvoiceById(invoice.id());
        assertThat(updatedInvoice.status()).isEqualTo(InvoiceStatus.PAID);
        assertThat(updatedInvoice.amountPaid()).isEqualByComparingTo("100.00");
        assertThat(updatedInvoice.balanceDue()).isEqualByComparingTo("0.00");

        PaymentReceivedResponse updatedPayment = paymentReceivedService.getPaymentReceivedById(payment.id());
        assertThat(updatedPayment.unallocatedAmount()).isEqualByComparingTo("0.00");

        // Verify bank balance updated
        BankAccount updatedAccount = bankAccountRepository.findById(bankAccount.id()).orElseThrow();
        assertThat(updatedAccount.getCurrentBalance()).isEqualByComparingTo("1100.00");
    }

    @Test
    @DisplayName("Should successfully create payment made, allocate against bill, and publish events")
    void testPaymentMadeAllocationSuccess() {
        BillResponse bill = billService.createBill(new BillRequest(
                vendor.getId(), null, null, "BILL-2001", LocalDate.now(), LocalDate.now().plusDays(30), "Vendor bill note",
                List.of(new PurchaseItemRequest(item.getId(), "Widget", new BigDecimal("2.0"), new BigDecimal("50.00"), BigDecimal.ZERO))
        ));
        bill = billService.recordBill(bill.id());

        PaymentMadeResponse payment = paymentMadeService.createPaymentMade(new PaymentMadeRequest(
                vendor.getId(), bankAccount.id(), "PAY-MADE-001", LocalDate.now(), PaymentMethod.BANK_TRANSFER,
                new BigDecimal("100.00"), "REF-200", "Paid vendor bill"
        ));

        PaymentMadeAllocationResponse allocation = paymentMadeService.allocate(
                payment.id(), bill.id(), new BigDecimal("100.00"), LocalDate.now()
        );

        assertThat(allocation).isNotNull();
        assertThat(allocation.allocatedAmount()).isEqualByComparingTo("100.00");

        BillResponse updatedBill = billService.getBillById(bill.id());
        assertThat(updatedBill.status()).isEqualTo(BillStatus.PAID);

        // Verify bank balance updated (withdrawal)
        BankAccount updatedAccount = bankAccountRepository.findById(bankAccount.id()).orElseThrow();
        assertThat(updatedAccount.getCurrentBalance()).isEqualByComparingTo("900.00");
    }

    @Test
    @DisplayName("Concurrent allocations against same invoice must not exceed invoice total amount")
    void testConcurrentAllocationsExceedingTotalAmountRejected() throws Exception {
        // Create an invoice for $100.00
        InvoiceResponse invoice = invoiceService.createInvoice(new InvoiceRequest(
                customer.getId(), null, null, "INV-CONCUR", LocalDate.now(), LocalDate.now().plusDays(30), "Concurrent test invoice",
                List.of(new SalesItemRequest(item.getId(), "Widget", new BigDecimal("1.0"), new BigDecimal("100.00"), BigDecimal.ZERO))
        ));
        invoice = invoiceService.issueInvoice(invoice.id());

        // Create two separate payments of $70.00 each
        PaymentReceivedResponse payment1 = paymentReceivedService.createPaymentReceived(new PaymentReceivedRequest(
                customer.getId(), bankAccount.id(), "PAY-C-01", LocalDate.now(), PaymentMethod.BANK_TRANSFER,
                new BigDecimal("70.00"), "REF-C1", "Payment 1"
        ));

        PaymentReceivedResponse payment2 = paymentReceivedService.createPaymentReceived(new PaymentReceivedRequest(
                customer.getId(), bankAccount.id(), "PAY-C-02", LocalDate.now(), PaymentMethod.BANK_TRANSFER,
                new BigDecimal("70.00"), "REF-C2", "Payment 2"
        ));

        UUID invoiceId = invoice.id();
        UUID p1Id = payment1.id();
        UUID p2Id = payment2.id();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch readyLatch = new CountDownLatch(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        Future<?> f1 = executor.submit(() -> {
            try {
                TenantContext.setTenantId(tenantId);
                readyLatch.countDown();
                startLatch.await();
                paymentReceivedService.allocate(p1Id, invoiceId, new BigDecimal("70.00"), LocalDate.now());
                successCount.incrementAndGet();
            } catch (Exception e) {
                failureCount.incrementAndGet();
            } finally {
                TenantContext.clear();
            }
        });

        Future<?> f2 = executor.submit(() -> {
            try {
                TenantContext.setTenantId(tenantId);
                readyLatch.countDown();
                startLatch.await();
                paymentReceivedService.allocate(p2Id, invoiceId, new BigDecimal("70.00"), LocalDate.now());
                successCount.incrementAndGet();
            } catch (Exception e) {
                failureCount.incrementAndGet();
            } finally {
                TenantContext.clear();
            }
        });

        readyLatch.await();
        startLatch.countDown();

        executor.shutdown();
        boolean finished = executor.awaitTermination(10, TimeUnit.SECONDS);
        assertThat(finished).isTrue();

        // Exactly one allocation must succeed, and one must fail!
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(1);

        // Verify total allocated amount on invoice is exactly $70.00
        BigDecimal sumAllocated = paymentReceivedAllocationRepository.sumAllocatedAmountByInvoiceId(invoiceId);
        assertThat(sumAllocated).isEqualByComparingTo("70.00");

        InvoiceResponse finalInvoice = invoiceService.getInvoiceById(invoiceId);
        assertThat(finalInvoice.status()).isEqualTo(InvoiceStatus.PARTIALLY_PAID);
        assertThat(finalInvoice.amountPaid()).isEqualByComparingTo("70.00");
        assertThat(finalInvoice.balanceDue()).isEqualByComparingTo("30.00");
    }
}
