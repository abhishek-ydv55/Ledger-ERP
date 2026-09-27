package com.company.erp.modules.accounting.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record JournalEntryDraft(
        String entryNumber,

        @NotNull(message = "Entry date is required")
        LocalDate entryDate,

        String description,
        String sourceType,
        UUID sourceId,

        @NotEmpty(message = "Journal entry must contain at least two lines")
        List<JournalEntryLineDraft> lines
) {
}
