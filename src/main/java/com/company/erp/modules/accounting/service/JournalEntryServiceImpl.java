package com.company.erp.modules.accounting.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineResponse;
import com.company.erp.modules.accounting.dto.JournalEntryResponse;
import com.company.erp.modules.accounting.entity.Account;
import com.company.erp.modules.accounting.entity.JournalEntry;
import com.company.erp.modules.accounting.entity.JournalEntryLine;
import com.company.erp.modules.accounting.entity.JournalEntryStatus;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.repository.JournalEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class JournalEntryServiceImpl implements JournalEntryService {

    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;
    private final com.company.erp.modules.audit.service.AuditService auditService;

    public JournalEntryServiceImpl(JournalEntryRepository journalEntryRepository,
                                  AccountRepository accountRepository,
                                  com.company.erp.modules.audit.service.AuditService auditService) {
        this.journalEntryRepository = journalEntryRepository;
        this.accountRepository = accountRepository;
        this.auditService = auditService;
    }

    @Override
    public JournalEntryResponse createDraft(JournalEntryDraft draft) {
        JournalEntry entry = buildJournalEntry(draft, JournalEntryStatus.DRAFT);
        JournalEntry saved = journalEntryRepository.save(entry);
        return mapToResponse(saved);
    }

    @Override
    public JournalEntryResponse post(JournalEntryDraft draft) {
        validateBalanceAndLines(draft);
        JournalEntry entry = buildJournalEntry(draft, JournalEntryStatus.POSTED);
        JournalEntry saved = journalEntryRepository.save(entry);
        JournalEntryResponse response = mapToResponse(saved);
        auditService.record("JOURNAL_ENTRY", saved.getId(), "POST", null, response);
        return response;
    }

    @Override
    public JournalEntryResponse post(UUID id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found with id: " + id));

        if (entry.getStatus() == JournalEntryStatus.POSTED) {
            throw new BusinessRuleViolationException("Journal entry is already posted");
        }
        if (entry.getStatus() == JournalEntryStatus.VOID) {
            throw new BusinessRuleViolationException("Cannot post a voided journal entry");
        }

        validateEntityBalance(entry);

        JournalEntryStatus oldStatus = entry.getStatus();
        entry.setStatus(JournalEntryStatus.POSTED);
        JournalEntry updated = journalEntryRepository.save(entry);
        JournalEntryResponse response = mapToResponse(updated);
        auditService.record("JOURNAL_ENTRY", updated.getId(), "POST", oldStatus, response);
        return response;
    }

    @Override
    public JournalEntryResponse voidEntry(UUID id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found with id: " + id));

        if (entry.getStatus() == JournalEntryStatus.DRAFT) {
            throw new BusinessRuleViolationException("Cannot void a draft journal entry; only posted entries can be voided");
        }
        if (entry.getStatus() == JournalEntryStatus.VOID) {
            throw new BusinessRuleViolationException("Journal entry is already voided");
        }

        JournalEntryStatus oldStatus = entry.getStatus();
        entry.setStatus(JournalEntryStatus.VOID);
        JournalEntry updated = journalEntryRepository.save(entry);
        JournalEntryResponse response = mapToResponse(updated);
        auditService.record("JOURNAL_ENTRY", updated.getId(), "VOID", oldStatus, response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public JournalEntryResponse getJournalEntryById(UUID id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry not found with id: " + id));
        return mapToResponse(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JournalEntryResponse> getAllJournalEntries() {
        return journalEntryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void validateBalanceAndLines(JournalEntryDraft draft) {
        if (draft.lines() == null || draft.lines().size() < 2) {
            throw new BusinessRuleViolationException("Journal entry must contain at least two lines");
        }

        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (JournalEntryLineDraft line : draft.lines()) {
            BigDecimal debit = line.debit() != null ? line.debit() : BigDecimal.ZERO;
            BigDecimal credit = line.credit() != null ? line.credit() : BigDecimal.ZERO;

            if (debit.compareTo(BigDecimal.ZERO) < 0 || credit.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleViolationException("Debit and credit values must be non-negative");
            }
            if (debit.compareTo(BigDecimal.ZERO) == 0 && credit.compareTo(BigDecimal.ZERO) == 0) {
                throw new BusinessRuleViolationException("Each line must have either debit or credit greater than zero");
            }
            if (debit.compareTo(BigDecimal.ZERO) > 0 && credit.compareTo(BigDecimal.ZERO) > 0) {
                throw new BusinessRuleViolationException("Line cannot have both debit and credit greater than zero");
            }

            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);
        }

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new BusinessRuleViolationException("Journal entry is unbalanced: total debits (" + totalDebit + ") must equal total credits (" + totalCredit + ")");
        }
    }

    private void validateEntityBalance(JournalEntry entry) {
        BigDecimal totalDebit = entry.getLines().stream()
                .map(l -> l.getDebit() != null ? l.getDebit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = entry.getLines().stream()
                .map(l -> l.getCredit() != null ? l.getCredit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new BusinessRuleViolationException("Journal entry is unbalanced: total debits (" + totalDebit + ") must equal total credits (" + totalCredit + ")");
        }
    }

    private JournalEntry buildJournalEntry(JournalEntryDraft draft, JournalEntryStatus status) {
        String entryNum = draft.entryNumber();
        if (entryNum == null || entryNum.isBlank()) {
            entryNum = "JE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } else if (journalEntryRepository.existsByEntryNumber(entryNum)) {
            throw new BusinessRuleViolationException("Journal entry with number '" + entryNum + "' already exists");
        }

        JournalEntry entry = new JournalEntry(
                entryNum,
                draft.entryDate(),
                draft.description(),
                status,
                draft.sourceType(),
                draft.sourceId()
        );
        entry.setOrganizationId(TenantContext.getTenantId());

        if (draft.lines() != null) {
            for (JournalEntryLineDraft lineDraft : draft.lines()) {
                Account account = accountRepository.findById(lineDraft.accountId())
                        .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + lineDraft.accountId()));

                if (account.isHeader()) {
                    throw new BusinessRuleViolationException("Cannot post journal entries directly to header account: " + account.getCode());
                }

                JournalEntryLine line = new JournalEntryLine(
                        account,
                        lineDraft.debit(),
                        lineDraft.credit(),
                        lineDraft.memo()
                );
                entry.addLine(line);
            }
        }

        return entry;
    }

    private JournalEntryResponse mapToResponse(JournalEntry entry) {
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        List<JournalEntryLineResponse> lineResponses = entry.getLines().stream()
                .map(line -> new JournalEntryLineResponse(
                        line.getId(),
                        line.getAccount().getId(),
                        line.getAccount().getCode(),
                        line.getAccount().getName(),
                        line.getDebit(),
                        line.getCredit(),
                        line.getMemo()
                ))
                .collect(Collectors.toList());

        for (JournalEntryLine line : entry.getLines()) {
            if (line.getDebit() != null) {
                totalDebit = totalDebit.add(line.getDebit());
            }
            if (line.getCredit() != null) {
                totalCredit = totalCredit.add(line.getCredit());
            }
        }

        return new JournalEntryResponse(
                entry.getId(),
                entry.getOrganizationId(),
                entry.getEntryNumber(),
                entry.getEntryDate(),
                entry.getDescription(),
                entry.getStatus(),
                entry.getSourceType(),
                entry.getSourceId(),
                totalDebit,
                totalCredit,
                lineResponses,
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
