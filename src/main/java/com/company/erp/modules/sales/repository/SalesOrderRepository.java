package com.company.erp.modules.sales.repository;

import com.company.erp.modules.sales.entity.SalesOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"customer", "estimate", "items", "items.item"})
    Optional<SalesOrder> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"customer", "estimate", "items", "items.item"})
    List<SalesOrder> findAll();

    Optional<SalesOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);
}
