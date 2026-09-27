package com.company.erp.modules.accounting.repository;

import com.company.erp.modules.accounting.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByCode(String code);

    boolean existsByCode(String code);

    List<Account> findByParentIdNull();

    @Query(value = """
        WITH RECURSIVE account_tree AS (
            SELECT id, organization_id, code, name, account_type, parent_id, is_active, is_header, created_at, updated_at, 0 AS level
            FROM chart_of_accounts
            WHERE parent_id IS NULL AND organization_id = :orgId
            UNION ALL
            SELECT c.id, c.organization_id, c.code, c.name, c.account_type, c.parent_id, c.is_active, c.is_header, c.created_at, c.updated_at, t.level + 1
            FROM chart_of_accounts c
            INNER JOIN account_tree t ON c.parent_id = t.id
        )
        SELECT id, organization_id, code, name, account_type, parent_id, is_active, is_header, created_at, updated_at
        FROM account_tree
        ORDER BY code
    """, nativeQuery = true)
    List<Account> findTreeByOrganizationId(@Param("orgId") UUID orgId);
}
