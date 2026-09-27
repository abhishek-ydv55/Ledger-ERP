package com.company.erp.modules.expenses.service;

import com.company.erp.modules.expenses.dto.ExpenseCategoryRequest;
import com.company.erp.modules.expenses.dto.ExpenseCategoryResponse;
import com.company.erp.modules.expenses.dto.ExpenseRequest;
import com.company.erp.modules.expenses.dto.ExpenseResponse;

import java.util.List;
import java.util.UUID;

public interface ExpenseService {
    ExpenseCategoryResponse createCategory(ExpenseCategoryRequest request);
    ExpenseCategoryResponse getCategoryById(UUID id);
    List<ExpenseCategoryResponse> getAllCategories();
    ExpenseCategoryResponse updateCategory(UUID id, ExpenseCategoryRequest request);
    void deleteCategory(UUID id);

    ExpenseResponse createExpense(ExpenseRequest request);
    ExpenseResponse getExpenseById(UUID id);
    List<ExpenseResponse> getAllExpenses();
    ExpenseResponse updateExpense(UUID id, ExpenseRequest request);
    void deleteExpense(UUID id);
}
