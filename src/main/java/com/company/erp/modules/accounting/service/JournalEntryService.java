package com.company.erp.modules.accounting.service;

import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryResponse;

import java.util.List;
import java.util.UUID;

public interface JournalEntryService {
    JournalEntryResponse createDraft(JournalEntryDraft draft);
    JournalEntryResponse post(JournalEntryDraft draft);
    JournalEntryResponse post(UUID id);
    JournalEntryResponse voidEntry(UUID id);
    JournalEntryResponse getJournalEntryById(UUID id);
    List<JournalEntryResponse> getAllJournalEntries();
}
