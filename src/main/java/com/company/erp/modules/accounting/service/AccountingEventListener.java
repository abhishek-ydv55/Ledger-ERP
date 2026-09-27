package com.company.erp.modules.accounting.service;

import com.company.erp.modules.sales.event.InvoiceIssuedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class AccountingEventListener {

    private static final Logger log = LoggerFactory.getLogger(AccountingEventListener.class);

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onInvoiceIssued(InvoiceIssuedEvent event) {
        log.info("Reacting to InvoiceIssuedEvent for invoice {} in organization {}. Creating journal entries...",
                event.invoice().getId(), event.invoice().getOrganizationId());
    }
}
