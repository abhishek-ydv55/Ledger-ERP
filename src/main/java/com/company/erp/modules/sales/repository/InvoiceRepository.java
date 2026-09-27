package com.company.erp.modules.sales.repository;

import com.company.erp.modules.sales.entity.Invoice;
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
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"customer", "salesOrder", "warehouse", "items", "items.item"})
    Optional<Invoice> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"customer", "salesOrder", "warehouse", "items", "items.item"})
    List<Invoice> findAll();

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.id = :id")
    Optional<Invoice> findByIdForUpdate(@Param("id") UUID id);
}
