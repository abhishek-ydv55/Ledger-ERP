package com.company.erp.modules.accounting.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.service.JournalEntryService;
import com.company.erp.modules.expenses.entity.ExpensePaymentStatus;
import com.company.erp.modules.expenses.event.ExpenseRecordedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class ExpenseAccountingEventListener {

    private final JournalEntryService journalEntryService;
    private final AccountRepository accountRepository;

    public ExpenseAccountingEventListener(JournalEntryService journalEntryService, AccountRepository accountRepository) {
        this.journalEntryService = journalEntryService;
        this.accountRepository = accountRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleExpenseRecorded(ExpenseRecordedEvent event) {
        UUID orgId = event.organizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        Account expenseAccount = getOrCreateAccount("5000", "Operating Expenses", AccountType.EXPENSE, orgId);

        List<JournalEntryLineDraft> lines = new ArrayList<>();

        // Debit Expense Account for total amount
        lines.add(new JournalEntryLineDraft(
                expenseAccount.getId(),
                event.totalAmount(),
                BigDecimal.ZERO,
                "Expense - " + event.categoryName() + " (" + event.expenseNumber() + ")"
        ));

        // Credit Accounts Payable if UNPAID and vendorId is set, else Bank/Cash
        if (event.paymentStatus() == ExpensePaymentStatus.UNPAID && event.vendorId() != null) {
            Account apAccount = getOrCreateAccount("2000", "Accounts Payable", AccountType.LIABILITY, orgId);
            lines.add(new JournalEntryLineDraft(
                    apAccount.getId(),
                    BigDecimal.ZERO,
                    event.totalAmount(),
                    "Accounts Payable - Expense " + event.expenseNumber()
            ));
        } else {
            Account bankCashAccount = getOrCreateAccount("1000", "Bank / Cash", AccountType.ASSET, orgId);
            lines.add(new JournalEntryLineDraft(
                    bankCashAccount.getId(),
                    BigDecimal.ZERO,
                    event.totalAmount(),
                    "Bank / Cash payment - Expense " + event.expenseNumber()
            ));
        }

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-EXP-" + event.expenseNumber(),
                event.expenseDate(),
                "Accounting entry for recorded Expense " + event.expenseNumber(),
                "EXPENSE",
                event.expenseId(),
                lines
        );

        journalEntryService.post(draft);
    }

    private Account getOrCreateAccount(String code, String name, AccountType type, UUID orgId) {
        return accountRepository.findByCode(code)
                .orElseGet(() -> {
                    Account acc = new Account(code, name, type, null, true, false);
                    acc.setOrganizationId(orgId);
                    return accountRepository.save(acc);
                });
    }
}
