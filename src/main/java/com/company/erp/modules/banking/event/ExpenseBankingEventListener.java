package com.company.erp.modules.banking.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.entity.BankTransaction;
import com.company.erp.modules.banking.entity.TransactionType;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.banking.repository.BankTransactionRepository;
import com.company.erp.modules.expenses.event.ExpenseRecordedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
public class ExpenseBankingEventListener {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;

    public ExpenseBankingEventListener(BankAccountRepository bankAccountRepository, BankTransactionRepository bankTransactionRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.bankTransactionRepository = bankTransactionRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleExpenseRecorded(ExpenseRecordedEvent event) {
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

        BankTransaction transaction = new BankTransaction(
                bankAccount,
                event.expenseDate(),
                event.totalAmount(),
                TransactionType.WITHDRAWAL,
                event.referenceNumber(),
                "Expense payment - " + event.expenseNumber() + " (" + event.categoryName() + ")",
                "EXPENSE",
                event.expenseId()
        );
        transaction.setOrganizationId(orgId);
        bankTransactionRepository.save(transaction);

        bankAccount.setCurrentBalance(bankAccount.getCurrentBalance().subtract(event.totalAmount()));
        bankAccountRepository.save(bankAccount);
    }
}
