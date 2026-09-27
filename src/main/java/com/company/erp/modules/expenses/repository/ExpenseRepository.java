package com.company.erp.modules.expenses.repository;

import com.company.erp.modules.expenses.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    boolean existsByExpenseNumber(String expenseNumber);
}
