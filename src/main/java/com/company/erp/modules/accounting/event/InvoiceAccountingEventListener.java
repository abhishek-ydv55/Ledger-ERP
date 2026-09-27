package com.company.erp.modules.accounting.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.service.JournalEntryService;
import com.company.erp.modules.sales.entity.Invoice;
import com.company.erp.modules.sales.event.InvoiceIssuedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class InvoiceAccountingEventListener {

    private final JournalEntryService journalEntryService;
    private final AccountRepository accountRepository;

    public InvoiceAccountingEventListener(JournalEntryService journalEntryService, AccountRepository accountRepository) {
        this.journalEntryService = journalEntryService;
        this.accountRepository = accountRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleInvoiceIssued(InvoiceIssuedEvent event) {
        Invoice invoice = event.invoice();
        UUID orgId = invoice.getOrganizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        Account arAccount = getOrCreateAccount("1200", "Accounts Receivable", AccountType.ASSET, orgId);
        Account salesAccount = getOrCreateAccount("4000", "Sales Revenue", AccountType.REVENUE, orgId);

        List<JournalEntryLineDraft> lines = new ArrayList<>();

        // Debit Accounts Receivable for total invoice amount
        lines.add(new JournalEntryLineDraft(
                arAccount.getId(),
                invoice.getTotalAmount(),
                BigDecimal.ZERO,
                "Accounts Receivable - Invoice " + invoice.getInvoiceNumber()
        ));

        // Credit Sales Revenue for subtotal
        lines.add(new JournalEntryLineDraft(
                salesAccount.getId(),
                BigDecimal.ZERO,
                invoice.getSubtotal(),
                "Sales Revenue - Invoice " + invoice.getInvoiceNumber()
        ));

        // Credit Tax Payable for tax amount if tax > 0
        if (invoice.getTaxAmount() != null && invoice.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            Account taxAccount = getOrCreateAccount("2200", "Tax Payable", AccountType.LIABILITY, orgId);
            lines.add(new JournalEntryLineDraft(
                    taxAccount.getId(),
                    BigDecimal.ZERO,
                    invoice.getTaxAmount(),
                    "Sales Tax Payable - Invoice " + invoice.getInvoiceNumber()
            ));
        }

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-INV-" + invoice.getInvoiceNumber(),
                invoice.getInvoiceDate(),
                "Accounting entry for issued Invoice " + invoice.getInvoiceNumber(),
                "INVOICE",
                invoice.getId(),
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
