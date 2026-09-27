package com.company.erp.modules.sales.repository;

import com.company.erp.modules.sales.entity.Estimate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EstimateRepository extends JpaRepository<Estimate, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"customer", "items", "items.item"})
    Optional<Estimate> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"customer", "items", "items.item"})
    List<Estimate> findAll();

    Optional<Estimate> findByEstimateNumber(String estimateNumber);

    boolean existsByEstimateNumber(String estimateNumber);
}
