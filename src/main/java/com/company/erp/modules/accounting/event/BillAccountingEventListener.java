package com.company.erp.modules.accounting.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.service.JournalEntryService;
import com.company.erp.modules.purchases.entity.Bill;
import com.company.erp.modules.purchases.event.BillRecordedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class BillAccountingEventListener {

    private final JournalEntryService journalEntryService;
    private final AccountRepository accountRepository;

    public BillAccountingEventListener(JournalEntryService journalEntryService, AccountRepository accountRepository) {
        this.journalEntryService = journalEntryService;
        this.accountRepository = accountRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleBillRecorded(BillRecordedEvent event) {
        Bill bill = event.bill();
        UUID orgId = bill.getOrganizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        Account expenseAccount = getOrCreateAccount("5000", "Cost of Goods Sold / Expense", AccountType.EXPENSE, orgId);
        Account apAccount = getOrCreateAccount("2000", "Accounts Payable", AccountType.LIABILITY, orgId);

        List<JournalEntryLineDraft> lines = new ArrayList<>();

        // Debit Expense / Inventory account for subtotal
        lines.add(new JournalEntryLineDraft(
                expenseAccount.getId(),
                bill.getSubtotal(),
                BigDecimal.ZERO,
                "Expense / Inventory - Bill " + bill.getBillNumber()
        ));

        // Debit Input Tax / Tax Payable for tax amount if tax > 0
        if (bill.getTaxAmount() != null && bill.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            Account taxAccount = getOrCreateAccount("2200", "Tax Payable", AccountType.LIABILITY, orgId);
            lines.add(new JournalEntryLineDraft(
                    taxAccount.getId(),
                    bill.getTaxAmount(),
                    BigDecimal.ZERO,
                    "Input Sales Tax - Bill " + bill.getBillNumber()
            ));
        }

        // Credit Accounts Payable for total bill amount
        lines.add(new JournalEntryLineDraft(
                apAccount.getId(),
                BigDecimal.ZERO,
                bill.getTotalAmount(),
                "Accounts Payable - Bill " + bill.getBillNumber()
        ));

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-BILL-" + bill.getBillNumber(),
                bill.getBillDate(),
                "Accounting entry for recorded Bill " + bill.getBillNumber(),
                "BILL",
                bill.getId(),
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
