package com.company.erp.modules.purchases.repository;

import com.company.erp.modules.purchases.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"vendor", "items", "items.item"})
    Optional<PurchaseOrder> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"vendor", "items", "items.item"})
    List<PurchaseOrder> findAll();

    Optional<PurchaseOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);
}
