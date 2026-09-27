package com.company.erp.modules.expenses.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.expenses.dto.ExpenseCategoryRequest;
import com.company.erp.modules.expenses.dto.ExpenseCategoryResponse;
import com.company.erp.modules.expenses.service.ExpenseService;
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
@RequestMapping({"/api/expenses/categories", "/api/v1/expenses/categories"})
@Tag(name = "Expense Categories", description = "Expense Category Management API")
public class ExpenseCategoryController {

    private final ExpenseService expenseService;

    public ExpenseCategoryController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    @Operation(summary = "Create a new expense category")
    public ResponseEntity<ApiResponse<ExpenseCategoryResponse>> createCategory(@Valid @RequestBody ExpenseCategoryRequest request) {
        ExpenseCategoryResponse created = expenseService.createCategory(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Expense category created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get expense category by ID")
    public ResponseEntity<ApiResponse<ExpenseCategoryResponse>> getCategoryById(@PathVariable UUID id) {
        ExpenseCategoryResponse category = expenseService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @GetMapping
    @Operation(summary = "Get all expense categories")
    public ResponseEntity<ApiResponse<List<ExpenseCategoryResponse>>> getAllCategories() {
        List<ExpenseCategoryResponse> categories = expenseService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing expense category")
    public ResponseEntity<ApiResponse<ExpenseCategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody ExpenseCategoryRequest request
    ) {
        ExpenseCategoryResponse updated = expenseService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Expense category updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete expense category by ID")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        expenseService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Expense category deleted successfully", null));
    }
}
