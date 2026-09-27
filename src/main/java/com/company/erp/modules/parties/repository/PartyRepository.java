package com.company.erp.modules.parties.repository;

import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.entity.PartyRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PartyRepository extends JpaRepository<Party, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"roles", "contacts", "addresses"})
    Optional<Party> findById(@NonNull UUID id);

    @EntityGraph(attributePaths = {"roles", "contacts", "addresses"})
    @Query("SELECT DISTINCT p FROM Party p JOIN p.roles r WHERE r = :role")
    List<Party> findByRole(@Param("role") PartyRole role);

    @EntityGraph(attributePaths = {"roles", "contacts", "addresses"})
    @Query("SELECT DISTINCT p FROM Party p JOIN p.roles r WHERE p.id = :id AND r = :role")
    Optional<Party> findByIdAndRole(@Param("id") UUID id, @Param("role") PartyRole role);

    boolean existsByCode(String code);
}
