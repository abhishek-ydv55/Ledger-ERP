package com.company.erp.modules.banking.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.banking.dto.BankAccountRequest;
import com.company.erp.modules.banking.dto.BankAccountResponse;
import com.company.erp.modules.banking.dto.BankTransactionResponse;
import com.company.erp.modules.banking.service.BankAccountService;
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
@RequestMapping({"/api/banking/accounts", "/api/v1/banking/accounts"})
@Tag(name = "Bank Accounts", description = "Banking Management API")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    @PostMapping
    @Operation(summary = "Create a new bank account")
    public ResponseEntity<ApiResponse<BankAccountResponse>> createBankAccount(@Valid @RequestBody BankAccountRequest request) {
        BankAccountResponse created = bankAccountService.createBankAccount(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bank account created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bank account by ID")
    public ResponseEntity<ApiResponse<BankAccountResponse>> getBankAccountById(@PathVariable UUID id) {
        BankAccountResponse account = bankAccountService.getBankAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @GetMapping
    @Operation(summary = "Get all bank accounts")
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getAllBankAccounts() {
        List<BankAccountResponse> accounts = bankAccountService.getAllBankAccounts();
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing bank account")
    public ResponseEntity<ApiResponse<BankAccountResponse>> updateBankAccount(
            @PathVariable UUID id,
            @Valid @RequestBody BankAccountRequest request
    ) {
        BankAccountResponse updated = bankAccountService.updateBankAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bank account updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete bank account by ID")
    public ResponseEntity<ApiResponse<Void>> deleteBankAccount(@PathVariable UUID id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Bank account deleted successfully", null));
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Get transactions for a bank account")
    public ResponseEntity<ApiResponse<List<BankTransactionResponse>>> getTransactions(@PathVariable UUID id) {
        List<BankTransactionResponse> transactions = bankAccountService.getTransactionsByAccountId(id);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }
}
