package com.company.erp.modules.banking.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.entity.BankTransaction;
import com.company.erp.modules.banking.entity.TransactionType;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.banking.repository.BankTransactionRepository;
import com.company.erp.modules.payments.event.PaymentAllocatedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
public class PaymentBankingEventListener {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;

    public PaymentBankingEventListener(BankAccountRepository bankAccountRepository, BankTransactionRepository bankTransactionRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.bankTransactionRepository = bankTransactionRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handlePaymentAllocated(PaymentAllocatedEvent event) {
        if (event.bankAccountId() == null) {
            return;
        }

        UUID orgId = event.organizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        BankAccount bankAccount = bankAccountRepository.findById(event.bankAccountId()).orElse(null);
        if (bankAccount == null) {
            return;
        }

        TransactionType txType = "PAYMENT_RECEIVED".equalsIgnoreCase(event.paymentType()) 
                ? TransactionType.DEPOSIT 
                : TransactionType.WITHDRAWAL;

        BankTransaction transaction = new BankTransaction(
                bankAccount,
                event.allocationDate(),
                event.amount(),
                txType,
                event.referenceNumber(),
                "Allocation for " + event.paymentType() + " against " + event.targetType() + " " + event.targetId(),
                event.paymentType(),
                event.paymentId()
        );
        transaction.setOrganizationId(orgId);
        bankTransactionRepository.save(transaction);

        if (txType == TransactionType.DEPOSIT) {
            bankAccount.setCurrentBalance(bankAccount.getCurrentBalance().add(event.amount()));
        } else {
            bankAccount.setCurrentBalance(bankAccount.getCurrentBalance().subtract(event.amount()));
        }
        bankAccountRepository.save(bankAccount);
    }
}
