package com.company.erp.modules.accounting;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.repository.AccountRepository;
import com.company.erp.modules.accounting.repository.JournalEntryRepository;
import com.company.erp.modules.accounting.service.JournalEntryServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class JournalEntryServiceTest {

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private JournalEntryServiceImpl journalEntryService;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Unbalanced journal entry is rejected before touching the database")
    void post_UnbalancedEntry_RejectedBeforeDatabase() {
        UUID account1 = UUID.randomUUID();
        UUID account2 = UUID.randomUUID();

        // Line 1: Debit 100.00
        JournalEntryLineDraft line1 = new JournalEntryLineDraft(account1, new BigDecimal("100.00"), BigDecimal.ZERO, "Debit 100");
        // Line 2: Credit 80.00 (Unbalanced: 100 != 80)
        JournalEntryLineDraft line2 = new JournalEntryLineDraft(account2, BigDecimal.ZERO, new BigDecimal("80.00"), "Credit 80");

        JournalEntryDraft unbalancedDraft = new JournalEntryDraft(
                "JE-UNBALANCED",
                LocalDate.now(),
                "Unbalanced entry test",
                "MANUAL",
                null,
                List.of(line1, line2)
        );

        assertThatThrownBy(() -> journalEntryService.post(unbalancedDraft))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Journal entry is unbalanced");

        // Verify that database was never touched (no repository interactions)
        verifyNoInteractions(journalEntryRepository);
        verifyNoInteractions(accountRepository);
    }
}
