package com.company.erp.modules.items.repository;

import com.company.erp.modules.items.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, UUID> {
    Optional<Unit> findByCode(String code);
    boolean existsByCode(String code);
}
