package com.company.erp.modules.accounting.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryResponse;
import com.company.erp.modules.accounting.service.JournalEntryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/accounting/journal-entries", "/api/v1/accounting/journal-entries"})
@Tag(name = "Journal Entries", description = "General Ledger Journal Entry Management API")
public class JournalEntryController {

    private final JournalEntryService journalEntryService;

    public JournalEntryController(JournalEntryService journalEntryService) {
        this.journalEntryService = journalEntryService;
    }

    @PostMapping("/draft")
    @Operation(summary = "Create a draft journal entry")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> createDraft(@Valid @RequestBody JournalEntryDraft draft) {
        JournalEntryResponse created = journalEntryService.createDraft(draft);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Draft journal entry created successfully", created));
    }

    @PostMapping("/post")
    @Operation(summary = "Post a new journal entry directly from draft")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> postDraft(@Valid @RequestBody JournalEntryDraft draft) {
        JournalEntryResponse posted = journalEntryService.post(draft);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Journal entry posted successfully", posted));
    }

    @PostMapping("/{id}/post")
    @Operation(summary = "Post an existing draft journal entry")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> postExistingEntry(@PathVariable UUID id) {
        JournalEntryResponse posted = journalEntryService.post(id);
        return ResponseEntity.ok(ApiResponse.success("Journal entry posted successfully", posted));
    }

    @PostMapping("/{id}/void")
    @Operation(summary = "Void a posted journal entry")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> voidEntry(@PathVariable UUID id) {
        JournalEntryResponse voided = journalEntryService.voidEntry(id);
        return ResponseEntity.ok(ApiResponse.success("Journal entry voided successfully", voided));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get journal entry by ID")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> getJournalEntryById(@PathVariable UUID id) {
        JournalEntryResponse entry = journalEntryService.getJournalEntryById(id);
        return ResponseEntity.ok(ApiResponse.success(entry));
    }

    @GetMapping
    @Operation(summary = "Get all journal entries")
    public ResponseEntity<ApiResponse<List<JournalEntryResponse>>> getAllJournalEntries() {
        List<JournalEntryResponse> entries = journalEntryService.getAllJournalEntries();
        return ResponseEntity.ok(ApiResponse.success(entries));
    }
}
