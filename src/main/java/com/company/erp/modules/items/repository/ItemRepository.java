package com.company.erp.modules.items.repository;

import com.company.erp.modules.items.entity.Item;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {

    @EntityGraph(attributePaths = {"category", "unit", "taxRate"})
    Optional<Item> findBySku(String sku);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"category", "unit", "taxRate"})
    Optional<Item> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"category", "unit", "taxRate"})
    List<Item> findAll();

    boolean existsBySku(String sku);
}
