package com.company.erp.modules.accounting.repository;

import com.company.erp.modules.accounting.entity.JournalEntry;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"lines", "lines.account"})
    Optional<JournalEntry> findById(@NonNull UUID id);

    @Override
    @NonNull
    @EntityGraph(attributePaths = {"lines", "lines.account"})
    List<JournalEntry> findAll();

    Optional<JournalEntry> findByEntryNumber(String entryNumber);

    boolean existsByEntryNumber(String entryNumber);
}
