package com.company.erp.modules.expenses.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.expenses.dto.ExpenseCategoryRequest;
import com.company.erp.modules.expenses.dto.ExpenseCategoryResponse;
import com.company.erp.modules.expenses.dto.ExpenseRequest;
import com.company.erp.modules.expenses.dto.ExpenseResponse;
import com.company.erp.modules.expenses.entity.Expense;
import com.company.erp.modules.expenses.entity.ExpenseCategory;
import com.company.erp.modules.expenses.entity.ExpensePaymentStatus;
import com.company.erp.modules.expenses.event.ExpenseRecordedEvent;
import com.company.erp.modules.expenses.repository.ExpenseCategoryRepository;
import com.company.erp.modules.expenses.repository.ExpenseRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseCategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;
    private final PartyRepository partyRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ExpenseServiceImpl(ExpenseCategoryRepository categoryRepository,
                              ExpenseRepository expenseRepository,
                              PartyRepository partyRepository,
                              BankAccountRepository bankAccountRepository,
                              ApplicationEventPublisher eventPublisher) {
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
        this.partyRepository = partyRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public ExpenseCategoryResponse createCategory(ExpenseCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new BusinessRuleViolationException("Expense category with name '" + request.name() + "' already exists");
        }

        ExpenseCategory category = new ExpenseCategory(
                request.name(),
                request.code(),
                request.description(),
                request.active() != null ? request.active() : true
        );
        category.setOrganizationId(TenantContext.getTenantId());

        ExpenseCategory saved = categoryRepository.save(category);
        return mapCategoryToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseCategoryResponse getCategoryById(UUID id) {
        ExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + id));
        return mapCategoryToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapCategoryToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExpenseCategoryResponse updateCategory(UUID id, ExpenseCategoryRequest request) {
        ExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + id));

        if (!category.getName().equals(request.name()) && categoryRepository.existsByName(request.name())) {
            throw new BusinessRuleViolationException("Expense category with name '" + request.name() + "' already exists");
        }

        category.setName(request.name());
        category.setCode(request.code());
        category.setDescription(request.description());
        if (request.active() != null) category.setActive(request.active());

        ExpenseCategory updated = categoryRepository.save(category);
        return mapCategoryToResponse(updated);
    }

    @Override
    public void deleteCategory(UUID id) {
        ExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + id));
        categoryRepository.delete(category);
    }

    @Override
    public ExpenseResponse createExpense(ExpenseRequest request) {
        if (expenseRepository.existsByExpenseNumber(request.expenseNumber())) {
            throw new BusinessRuleViolationException("Expense with number '" + request.expenseNumber() + "' already exists");
        }

        ExpenseCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + request.categoryId()));

        Party vendor = null;
        if (request.vendorId() != null) {
            vendor = partyRepository.findById(request.vendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));
        }

        BankAccount bankAccount = null;
        if (request.bankAccountId() != null) {
            bankAccount = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + request.bankAccountId()));
        }

        BigDecimal taxAmount = request.taxAmount() != null ? request.taxAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = request.amount().add(taxAmount);
        ExpensePaymentStatus paymentStatus = request.paymentStatus() != null ? request.paymentStatus() : ExpensePaymentStatus.PAID;

        Expense expense = new Expense(
                category,
                vendor,
                bankAccount,
                request.expenseNumber(),
                request.expenseDate(),
                request.amount(),
                taxAmount,
                totalAmount,
                paymentStatus,
                request.paymentMethod(),
                request.referenceNumber(),
                request.description()
        );
        expense.setOrganizationId(TenantContext.getTenantId());

        Expense saved = expenseRepository.save(expense);

        eventPublisher.publishEvent(new ExpenseRecordedEvent(
                saved.getId(),
                saved.getOrganizationId(),
                category.getId(),
                category.getName(),
                vendor != null ? vendor.getId() : null,
                bankAccount != null ? bankAccount.getId() : null,
                saved.getAmount(),
                saved.getTaxAmount(),
                saved.getTotalAmount(),
                saved.getPaymentStatus(),
                saved.getExpenseDate(),
                saved.getExpenseNumber(),
                saved.getReferenceNumber(),
                saved.getDescription()
        ));

        return mapExpenseToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(UUID id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        return mapExpenseToResponse(expense);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpenses() {
        return expenseRepository.findAll().stream()
                .map(this::mapExpenseToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ExpenseResponse updateExpense(UUID id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        if (!expense.getExpenseNumber().equals(request.expenseNumber()) && expenseRepository.existsByExpenseNumber(request.expenseNumber())) {
            throw new BusinessRuleViolationException("Expense with number '" + request.expenseNumber() + "' already exists");
        }

        ExpenseCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense category not found with id: " + request.categoryId()));

        Party vendor = null;
        if (request.vendorId() != null) {
            vendor = partyRepository.findById(request.vendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));
        }

        BankAccount bankAccount = null;
        if (request.bankAccountId() != null) {
            bankAccount = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + request.bankAccountId()));
        }

        BigDecimal taxAmount = request.taxAmount() != null ? request.taxAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = request.amount().add(taxAmount);
        ExpensePaymentStatus paymentStatus = request.paymentStatus() != null ? request.paymentStatus() : ExpensePaymentStatus.PAID;

        expense.setCategory(category);
        expense.setVendor(vendor);
        expense.setBankAccount(bankAccount);
        expense.setExpenseNumber(request.expenseNumber());
        expense.setExpenseDate(request.expenseDate());
        expense.setAmount(request.amount());
        expense.setTaxAmount(taxAmount);
        expense.setTotalAmount(totalAmount);
        expense.setPaymentStatus(paymentStatus);
        expense.setPaymentMethod(request.paymentMethod());
        expense.setReferenceNumber(request.referenceNumber());
        expense.setDescription(request.description());

        Expense updated = expenseRepository.save(expense);
        return mapExpenseToResponse(updated);
    }

    @Override
    public void deleteExpense(UUID id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        expenseRepository.delete(expense);
    }

    private ExpenseCategoryResponse mapCategoryToResponse(ExpenseCategory category) {
        return new ExpenseCategoryResponse(
                category.getId(),
                category.getOrganizationId(),
                category.getName(),
                category.getCode(),
                category.getDescription(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    private ExpenseResponse mapExpenseToResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getOrganizationId(),
                expense.getCategory() != null ? expense.getCategory().getId() : null,
                expense.getCategory() != null ? expense.getCategory().getName() : null,
                expense.getVendor() != null ? expense.getVendor().getId() : null,
                expense.getVendor() != null ? expense.getVendor().getName() : null,
                expense.getBankAccount() != null ? expense.getBankAccount().getId() : null,
                expense.getBankAccount() != null ? expense.getBankAccount().getAccountName() : null,
                expense.getExpenseNumber(),
                expense.getExpenseDate(),
                expense.getAmount(),
                expense.getTaxAmount(),
                expense.getTotalAmount(),
                expense.getPaymentStatus(),
                expense.getPaymentMethod(),
                expense.getReferenceNumber(),
                expense.getDescription(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }
}
