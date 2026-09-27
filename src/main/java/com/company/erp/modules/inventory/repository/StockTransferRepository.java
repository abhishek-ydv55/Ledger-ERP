package com.company.erp.modules.inventory.repository;

import com.company.erp.modules.inventory.entity.StockTransfer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"sourceWarehouse", "destinationWarehouse", "items", "items.item"})
    Optional<StockTransfer> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"sourceWarehouse", "destinationWarehouse", "items", "items.item"})
    List<StockTransfer> findAll();

    Optional<StockTransfer> findByTransferNumber(String transferNumber);

    boolean existsByTransferNumber(String transferNumber);
}
