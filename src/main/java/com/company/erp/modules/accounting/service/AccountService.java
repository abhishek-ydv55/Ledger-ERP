package com.company.erp.modules.accounting.service;

import com.company.erp.modules.accounting.dto.AccountRequest;
import com.company.erp.modules.accounting.dto.AccountResponse;
import com.company.erp.modules.accounting.dto.AccountTreeNode;

import java.util.List;
import java.util.UUID;

public interface AccountService {
    AccountResponse createAccount(AccountRequest request);
    AccountResponse getAccountById(UUID id);
    List<AccountResponse> getAllAccounts();
    List<AccountTreeNode> getAccountTree();
    AccountResponse updateAccount(UUID id, AccountRequest request);
    void deleteAccount(UUID id);
}
