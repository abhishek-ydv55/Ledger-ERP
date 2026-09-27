package com.company.erp.modules.items.repository;

import com.company.erp.modules.items.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {
    Optional<TaxRate> findByName(String name);
    boolean existsByName(String name);
}
