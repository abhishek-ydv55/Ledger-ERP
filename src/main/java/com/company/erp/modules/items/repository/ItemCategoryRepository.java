package com.company.erp.modules.items.repository;

import com.company.erp.modules.items.entity.ItemCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ItemCategoryRepository extends JpaRepository<ItemCategory, UUID> {
    Optional<ItemCategory> findByName(String name);
    boolean existsByName(String name);
}
