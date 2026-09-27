package com.company.erp.modules.accounting.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.service.JournalEntryService;
import com.company.erp.modules.payments.event.PaymentAllocatedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class PaymentAccountingEventListener {

    private final JournalEntryService journalEntryService;
    private final AccountRepository accountRepository;

    public PaymentAccountingEventListener(JournalEntryService journalEntryService, AccountRepository accountRepository) {
        this.journalEntryService = journalEntryService;
        this.accountRepository = accountRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handlePaymentAllocated(PaymentAllocatedEvent event) {
        UUID orgId = event.organizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        List<JournalEntryLineDraft> lines = new ArrayList<>();

        if ("PAYMENT_RECEIVED".equalsIgnoreCase(event.paymentType())) {
            Account bankCashAccount = getOrCreateAccount("1000", "Bank / Cash", AccountType.ASSET, orgId);
            Account arAccount = getOrCreateAccount("1200", "Accounts Receivable", AccountType.ASSET, orgId);

            // Debit Bank/Cash
            lines.add(new JournalEntryLineDraft(
                    bankCashAccount.getId(),
                    event.amount(),
                    BigDecimal.ZERO,
                    "Payment received allocation for Invoice " + event.targetId()
            ));

            // Credit Accounts Receivable
            lines.add(new JournalEntryLineDraft(
                    arAccount.getId(),
                    BigDecimal.ZERO,
                    event.amount(),
                    "Accounts Receivable reduction for Invoice " + event.targetId()
            ));

            JournalEntryDraft draft = new JournalEntryDraft(
                    "JE-PAY-REC-" + event.allocationId().toString().substring(0, 8),
                    event.allocationDate(),
                    "Accounting entry for payment received allocation",
                    "PAYMENT_RECEIVED",
                    event.paymentId(),
                    lines
            );
            journalEntryService.post(draft);

        } else if ("PAYMENT_MADE".equalsIgnoreCase(event.paymentType())) {
            Account apAccount = getOrCreateAccount("2000", "Accounts Payable", AccountType.LIABILITY, orgId);
            Account bankCashAccount = getOrCreateAccount("1000", "Bank / Cash", AccountType.ASSET, orgId);

            // Debit Accounts Payable
            lines.add(new JournalEntryLineDraft(
                    apAccount.getId(),
                    event.amount(),
                    BigDecimal.ZERO,
                    "Accounts Payable reduction for Bill " + event.targetId()
            ));

            // Credit Bank/Cash
            lines.add(new JournalEntryLineDraft(
                    bankCashAccount.getId(),
                    BigDecimal.ZERO,
                    event.amount(),
                    "Payment made allocation for Bill " + event.targetId()
            ));

            JournalEntryDraft draft = new JournalEntryDraft(
                    "JE-PAY-MADE-" + event.allocationId().toString().substring(0, 8),
                    event.allocationDate(),
                    "Accounting entry for payment made allocation",
                    "PAYMENT_MADE",
                    event.paymentId(),
                    lines
            );
            journalEntryService.post(draft);
        }
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
