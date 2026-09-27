package com.company.erp.modules.accounting.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.AccountRequest;
import com.company.erp.modules.accounting.dto.AccountResponse;
import com.company.erp.modules.accounting.dto.AccountTreeNode;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;

    public AccountServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public AccountResponse createAccount(AccountRequest request) {
        if (accountRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Account with code '" + request.code() + "' already exists");
        }

        Account parent = null;
        if (request.parentId() != null) {
            parent = accountRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent account not found with id: " + request.parentId()));
        }

        Account account = new Account(
                request.code(),
                request.name(),
                request.accountType(),
                parent,
                request.active() != null ? request.active() : true,
                request.header() != null ? request.header() : false
        );
        account.setOrganizationId(TenantContext.getTenantId());

        Account saved = accountRepository.save(account);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        return mapToResponse(account);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountTreeNode> getAccountTree() {
        UUID orgId = TenantContext.getTenantId();
        List<Account> flatAccounts = orgId != null
                ? accountRepository.findTreeByOrganizationId(orgId)
                : accountRepository.findAll();

        Map<UUID, AccountTreeNode> nodeMap = new HashMap<>();
        List<AccountTreeNode> roots = new ArrayList<>();

        // First pass: create node objects
        for (Account account : flatAccounts) {
            AccountTreeNode node = new AccountTreeNode(
                    account.getId(),
                    account.getCode(),
                    account.getName(),
                    account.getAccountType(),
                    account.isHeader(),
                    account.isActive(),
                    account.getParent() != null ? account.getParent().getId() : null,
                    new ArrayList<>()
            );
            nodeMap.put(account.getId(), node);
        }

        // Second pass: link parents and children
        for (Account account : flatAccounts) {
            AccountTreeNode currentNode = nodeMap.get(account.getId());
            if (account.getParent() != null && nodeMap.containsKey(account.getParent().getId())) {
                nodeMap.get(account.getParent().getId()).children().add(currentNode);
            } else {
                roots.add(currentNode);
            }
        }

        return roots;
    }

    @Override
    public AccountResponse updateAccount(UUID id, AccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));

        if (!account.getCode().equals(request.code()) && accountRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Account with code '" + request.code() + "' already exists");
        }

        Account parent = null;
        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new BusinessRuleViolationException("An account cannot be its own parent");
            }
            parent = accountRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent account not found with id: " + request.parentId()));
        }

        account.setCode(request.code());
        account.setName(request.name());
        account.setAccountType(request.accountType());
        account.setParent(parent);
        if (request.active() != null) {
            account.setActive(request.active());
        }
        if (request.header() != null) {
            account.setHeader(request.header());
        }

        Account updated = accountRepository.save(account);
        return mapToResponse(updated);
    }

    @Override
    public void deleteAccount(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + id));
        accountRepository.delete(account);
    }

    private AccountResponse mapToResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getOrganizationId(),
                account.getCode(),
                account.getName(),
                account.getAccountType(),
                account.getParent() != null ? account.getParent().getId() : null,
                account.getParent() != null ? account.getParent().getCode() : null,
                account.getParent() != null ? account.getParent().getName() : null,
                account.isActive(),
                account.isHeader(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }
}
