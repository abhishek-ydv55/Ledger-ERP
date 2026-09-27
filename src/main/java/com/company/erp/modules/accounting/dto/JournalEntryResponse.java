package com.company.erp.modules.accounting.dto;

import com.company.erp.modules.accounting.entity.JournalEntryStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record JournalEntryResponse(
        UUID id,
        UUID organizationId,
        String entryNumber,
        LocalDate entryDate,
        String description,
        JournalEntryStatus status,
        String sourceType,
        UUID sourceId,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        List<JournalEntryLineResponse> lines,
        Instant createdAt,
        Instant updatedAt
) {
}
