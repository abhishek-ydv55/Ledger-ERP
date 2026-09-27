package com.company.erp.modules.expenses;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.entity.JournalEntry;
import com.company.erp.modules.accounting.repository.JournalEntryRepository;
import com.company.erp.modules.banking.dto.BankAccountRequest;
import com.company.erp.modules.banking.dto.BankAccountResponse;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.entity.BankTransaction;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.banking.repository.BankTransactionRepository;
import com.company.erp.modules.banking.service.BankAccountService;
import com.company.erp.modules.expenses.dto.ExpenseCategoryRequest;
import com.company.erp.modules.expenses.dto.ExpenseCategoryResponse;
import com.company.erp.modules.expenses.dto.ExpenseRequest;
import com.company.erp.modules.expenses.dto.ExpenseResponse;
import com.company.erp.modules.expenses.entity.ExpensePaymentStatus;
import com.company.erp.modules.expenses.service.ExpenseService;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.entity.PartyRole;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.payments.entity.PaymentMethod;
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
public class ExpensesIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private BankAccountService bankAccountService;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private BankTransactionRepository bankTransactionRepository;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private PartyRepository partyRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private Party vendor;
    private BankAccountResponse bankAccount;
    private ExpenseCategoryResponse category;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM bank_transactions");
        jdbcTemplate.execute("DELETE FROM bank_accounts");
        jdbcTemplate.execute("DELETE FROM journal_entry_lines");
        jdbcTemplate.execute("DELETE FROM journal_entries");
        jdbcTemplate.execute("DELETE FROM expenses");
        jdbcTemplate.execute("DELETE FROM expense_categories");
        jdbcTemplate.execute("DELETE FROM party_roles");
        jdbcTemplate.execute("DELETE FROM party_contacts");
        jdbcTemplate.execute("DELETE FROM party_addresses");
        jdbcTemplate.execute("DELETE FROM parties");
        jdbcTemplate.execute("DELETE FROM chart_of_accounts");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenantId, "Test Tenant", "TENANT_1", true
        );

        TenantContext.setTenantId(tenantId);

        vendor = new Party("Office Supplies Co", "VEND-EXP", "exp@supplies.com", "555-0303", "TAX-EXP", true);
        vendor.setOrganizationId(tenantId);
        vendor.setRoles(Set.of(PartyRole.VENDOR));
        vendor = partyRepository.save(vendor);

        bankAccount = bankAccountService.createBankAccount(new BankAccountRequest(
                "Expense Checking", "ACC-EXP-01", "City Bank", "USD", new BigDecimal("5000.00"), true
        ));

        category = expenseService.createCategory(new ExpenseCategoryRequest(
                "Office Supplies", "CAT-OFFICE", "Stationery and supplies", true
        ));
    }

    @Test
    @DisplayName("Should successfully create expense category and retrieve it")
    void testExpenseCategoryCrud() {
        ExpenseCategoryResponse fetched = expenseService.getCategoryById(category.id());
        assertThat(fetched).isNotNull();
        assertThat(fetched.name()).isEqualTo("Office Supplies");
        assertThat(fetched.code()).isEqualTo("CAT-OFFICE");
    }

    @Test
    @DisplayName("Creating a paid expense with bank account should trigger accounting journal entry and bank transaction withdrawal")
    void testCreatePaidExpenseWithBankAccount() {
        ExpenseResponse expense = expenseService.createExpense(new ExpenseRequest(
                category.id(),
                vendor.getId(),
                bankAccount.id(),
                "EXP-1001",
                LocalDate.now(),
                new BigDecimal("200.00"),
                new BigDecimal("20.00"),
                ExpensePaymentStatus.PAID,
                PaymentMethod.BANK_TRANSFER,
                "REF-EXP-1",
                "Printer paper and toner"
        ));

        assertThat(expense).isNotNull();
        assertThat(expense.amount()).isEqualByComparingTo("200.00");
        assertThat(expense.taxAmount()).isEqualByComparingTo("20.00");
        assertThat(expense.totalAmount()).isEqualByComparingTo("220.00");

        // Verify Journal Entry created by accounting listener
        List<JournalEntry> entries = journalEntryRepository.findAll();
        assertThat(entries).isNotEmpty();
        JournalEntry je = entries.stream()
                .filter(e -> "EXPENSE".equals(e.getSourceType()) && expense.id().equals(e.getSourceId()))
                .findFirst()
                .orElse(null);
        assertThat(je).isNotNull();

        // Verify Bank Transaction created by banking listener
        List<BankTransaction> transactions = bankTransactionRepository.findByBankAccountId(bankAccount.id());
        assertThat(transactions).hasSize(1);
        BankTransaction tx = transactions.get(0);
        assertThat(tx.getAmount()).isEqualByComparingTo("220.00");
        assertThat(tx.getSourceType()).isEqualTo("EXPENSE");

        // Verify Bank Account balance updated (5000 - 220 = 4780)
        BankAccount updatedAccount = bankAccountRepository.findById(bankAccount.id()).orElseThrow();
        assertThat(updatedAccount.getCurrentBalance()).isEqualByComparingTo("4780.00");
    }

    @Test
    @DisplayName("Creating an unpaid expense with vendor should credit Accounts Payable in journal entry")
    void testCreateUnpaidExpenseWithVendor() {
        ExpenseResponse expense = expenseService.createExpense(new ExpenseRequest(
                category.id(),
                vendor.getId(),
                null, // No bank account yet
                "EXP-1002",
                LocalDate.now(),
                new BigDecimal("500.00"),
                BigDecimal.ZERO,
                ExpensePaymentStatus.UNPAID,
                null,
                "REF-EXP-2",
                "Unpaid office furniture expense"
        ));

        assertThat(expense).isNotNull();
        assertThat(expense.totalAmount()).isEqualByComparingTo("500.00");
        assertThat(expense.paymentStatus()).isEqualTo(ExpensePaymentStatus.UNPAID);

        // Verify Journal Entry created by accounting listener
        List<JournalEntry> entries = journalEntryRepository.findAll();
        JournalEntry je = entries.stream()
                .filter(e -> "EXPENSE".equals(e.getSourceType()) && expense.id().equals(e.getSourceId()))
                .findFirst()
                .orElse(null);
        assertThat(je).isNotNull();
        assertThat(je.getLines()).hasSize(2);
    }
}
