package com.company.erp.modules.purchases.repository;

import com.company.erp.modules.purchases.entity.Bill;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillRepository extends JpaRepository<Bill, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"vendor", "purchaseOrder", "warehouse", "items", "items.item"})
    Optional<Bill> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"vendor", "purchaseOrder", "warehouse", "items", "items.item"})
    List<Bill> findAll();

    Optional<Bill> findByBillNumber(String billNumber);

    boolean existsByBillNumber(String billNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bill b WHERE b.id = :id")
    Optional<Bill> findByIdForUpdate(@Param("id") UUID id);
}
