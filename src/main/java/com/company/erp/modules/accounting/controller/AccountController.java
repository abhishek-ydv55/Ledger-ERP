package com.company.erp.modules.accounting.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.accounting.dto.AccountRequest;
import com.company.erp.modules.accounting.dto.AccountResponse;
import com.company.erp.modules.accounting.dto.AccountTreeNode;
import com.company.erp.modules.accounting.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/accounting/chart-of-accounts", "/api/v1/accounting/chart-of-accounts"})
@Tag(name = "Chart of Accounts", description = "Chart of Accounts API")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @Operation(summary = "Create a new account in Chart of Accounts")
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(@Valid @RequestBody AccountRequest request) {
        AccountResponse created = accountService.createAccount(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountById(@PathVariable UUID id) {
        AccountResponse account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @GetMapping
    @Operation(summary = "Get all accounts")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAllAccounts() {
        List<AccountResponse> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/tree")
    @Operation(summary = "Get full Chart of Accounts tree hierarchy using recursive CTE")
    public ResponseEntity<ApiResponse<List<AccountTreeNode>>> getAccountTree() {
        List<AccountTreeNode> tree = accountService.getAccountTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update account")
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @PathVariable UUID id,
            @Valid @RequestBody AccountRequest request
    ) {
        AccountResponse updated = accountService.updateAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Account updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete account by ID")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable UUID id) {
        accountService.deleteAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully", null));
    }
}
