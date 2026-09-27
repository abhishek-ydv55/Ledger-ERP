package com.company.erp.modules.banking.service;

import com.company.erp.modules.banking.dto.BankAccountRequest;
import com.company.erp.modules.banking.dto.BankAccountResponse;
import com.company.erp.modules.banking.dto.BankTransactionResponse;

import java.util.List;
import java.util.UUID;

public interface BankAccountService {
    BankAccountResponse createBankAccount(BankAccountRequest request);
    BankAccountResponse getBankAccountById(UUID id);
    List<BankAccountResponse> getAllBankAccounts();
    BankAccountResponse updateBankAccount(UUID id, BankAccountRequest request);
    void deleteBankAccount(UUID id);
    List<BankTransactionResponse> getTransactionsByAccountId(UUID accountId);
}
