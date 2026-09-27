package com.company.erp.modules.banking.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.dto.BankAccountRequest;
import com.company.erp.modules.banking.dto.BankAccountResponse;
import com.company.erp.modules.banking.dto.BankTransactionResponse;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.entity.BankTransaction;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.banking.repository.BankTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;

    public BankAccountServiceImpl(BankAccountRepository bankAccountRepository, BankTransactionRepository bankTransactionRepository) {
        this.bankAccountRepository = bankAccountRepository;
        this.bankTransactionRepository = bankTransactionRepository;
    }

    @Override
    public BankAccountResponse createBankAccount(BankAccountRequest request) {
        if (bankAccountRepository.existsByAccountNumber(request.accountNumber())) {
            throw new BusinessRuleViolationException("Bank account with number '" + request.accountNumber() + "' already exists");
        }

        BigDecimal opening = request.openingBalance() != null ? request.openingBalance() : BigDecimal.ZERO;

        BankAccount bankAccount = new BankAccount(
                request.accountName(),
                request.accountNumber(),
                request.bankName(),
                request.currency() != null ? request.currency() : "USD",
                opening,
                opening,
                request.active() != null ? request.active() : true
        );
        bankAccount.setOrganizationId(TenantContext.getTenantId());

        BankAccount saved = bankAccountRepository.save(bankAccount);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountResponse getBankAccountById(UUID id) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));
        return mapToResponse(bankAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> getAllBankAccounts() {
        return bankAccountRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BankAccountResponse updateBankAccount(UUID id, BankAccountRequest request) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));

        if (!bankAccount.getAccountNumber().equals(request.accountNumber()) && bankAccountRepository.existsByAccountNumber(request.accountNumber())) {
            throw new BusinessRuleViolationException("Bank account with number '" + request.accountNumber() + "' already exists");
        }

        bankAccount.setAccountName(request.accountName());
        bankAccount.setAccountNumber(request.accountNumber());
        bankAccount.setBankName(request.bankName());
        if (request.currency() != null) bankAccount.setCurrency(request.currency());
        if (request.active() != null) bankAccount.setActive(request.active());

        BankAccount updated = bankAccountRepository.save(bankAccount);
        return mapToResponse(updated);
    }

    @Override
    public void deleteBankAccount(UUID id) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));
        bankAccountRepository.delete(bankAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankTransactionResponse> getTransactionsByAccountId(UUID accountId) {
        if (!bankAccountRepository.existsById(accountId)) {
            throw new ResourceNotFoundException("Bank account not found with id: " + accountId);
        }
        return bankTransactionRepository.findByBankAccountId(accountId).stream()
                .map(this::mapTransactionToResponse)
                .collect(Collectors.toList());
    }

    private BankAccountResponse mapToResponse(BankAccount account) {
        return new BankAccountResponse(
                account.getId(),
                account.getOrganizationId(),
                account.getAccountName(),
                account.getAccountNumber(),
                account.getBankName(),
                account.getCurrency(),
                account.getOpeningBalance(),
                account.getCurrentBalance(),
                account.isActive(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    private BankTransactionResponse mapTransactionToResponse(BankTransaction tx) {
        return new BankTransactionResponse(
                tx.getId(),
                tx.getOrganizationId(),
                tx.getBankAccount() != null ? tx.getBankAccount().getId() : null,
                tx.getBankAccount() != null ? tx.getBankAccount().getAccountName() : null,
                tx.getTransactionDate(),
                tx.getAmount(),
                tx.getTransactionType(),
                tx.getReferenceNumber(),
                tx.getDescription(),
                tx.getSourceType(),
                tx.getSourceId(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}
