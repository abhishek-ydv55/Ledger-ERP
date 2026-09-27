package com.company.erp.modules.accounting;

import com.company.erp.BaseIntegrationTest;
import com.company.erp.common.domain.TenantScopedEntity;
import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.accounting.dto.AccountRequest;
import com.company.erp.modules.accounting.dto.AccountResponse;
import com.company.erp.modules.accounting.dto.AccountTreeNode;
import com.company.erp.modules.accounting.dto.JournalEntryDraft;
import com.company.erp.modules.accounting.dto.JournalEntryLineDraft;
import com.company.erp.modules.accounting.dto.JournalEntryResponse;
import com.company.erp.modules.accounting.entity.AccountType;
import com.company.erp.modules.accounting.entity.JournalEntryStatus;
import com.company.erp.modules.accounting.service.AccountService;
import com.company.erp.modules.accounting.service.JournalEntryService;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@AutoConfigureMockMvc(addFilters = false)
public class AccountingIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AccountService accountService;

    @Autowired
    private JournalEntryService journalEntryService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private final UUID tenant1 = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM journal_entry_lines");
        jdbcTemplate.execute("DELETE FROM journal_entries");
        jdbcTemplate.execute("DELETE FROM chart_of_accounts");
        jdbcTemplate.execute("DELETE FROM organizations");

        jdbcTemplate.update(
                "INSERT INTO organizations (id, name, code, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                tenant1, "Org One", "ORG1", true
        );

        TenantContext.setTenantId(tenant1);
        enableTenantFilter(tenant1);
    }

    @Test
    @DisplayName("Full cycle: draft -> post -> void journal entry state transitions")
    void fullDraftPostVoidCycle() {
        // Create accounts
        AccountResponse cashAcc = accountService.createAccount(new AccountRequest("1010", "Cash on Hand", AccountType.ASSET, null, true, false));
        AccountResponse salesAcc = accountService.createAccount(new AccountRequest("4010", "Sales Revenue", AccountType.REVENUE, null, true, false));

        // Create Journal Entry Draft
        JournalEntryLineDraft debitLine = new JournalEntryLineDraft(cashAcc.id(), new BigDecimal("500.00"), BigDecimal.ZERO, "Receive Cash");
        JournalEntryLineDraft creditLine = new JournalEntryLineDraft(salesAcc.id(), BigDecimal.ZERO, new BigDecimal("500.00"), "Record Sales");

        JournalEntryDraft draft = new JournalEntryDraft(
                "JE-2026-001",
                LocalDate.now(),
                "Sales transaction",
                "SALES",
                UUID.randomUUID(),
                List.of(debitLine, creditLine)
        );

        // 1. Create Draft
        JournalEntryResponse draftResp = journalEntryService.createDraft(draft);
        assertThat(draftResp.status()).isEqualTo(JournalEntryStatus.DRAFT);
        assertThat(draftResp.totalDebit()).isEqualByComparingTo("500.00");
        assertThat(draftResp.totalCredit()).isEqualByComparingTo("500.00");

        // Attempt invalid transition: void a DRAFT entry -> Should fail
        assertThatThrownBy(() -> journalEntryService.voidEntry(draftResp.id()))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Cannot void a draft journal entry");

        // 2. Post Draft
        JournalEntryResponse postedResp = journalEntryService.post(draftResp.id());
        assertThat(postedResp.status()).isEqualTo(JournalEntryStatus.POSTED);

        // Attempt invalid transition: post an already POSTED entry -> Should fail
        assertThatThrownBy(() -> journalEntryService.post(draftResp.id()))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Journal entry is already posted");

        // 3. Void Posted Entry
        JournalEntryResponse voidedResp = journalEntryService.voidEntry(draftResp.id());
        assertThat(voidedResp.status()).isEqualTo(JournalEntryStatus.VOID);

        // Attempt invalid transition: post a VOID entry -> Should fail
        assertThatThrownBy(() -> journalEntryService.post(draftResp.id()))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Cannot post a voided journal entry");
    }

    @Test
    @DisplayName("Chart of Accounts tree hierarchy returns recursive tree structure")
    void chartOfAccounts_TreeHierarchy_Success() {
        // Create parent account: 1000 Assets (Header)
        AccountResponse parentAcc = accountService.createAccount(
                new AccountRequest("1000", "Assets", AccountType.ASSET, null, true, true)
        );

        // Create child accounts under 1000 Assets
        AccountResponse childAcc1 = accountService.createAccount(
                new AccountRequest("1010", "Cash on Hand", AccountType.ASSET, parentAcc.id(), true, false)
        );
        AccountResponse childAcc2 = accountService.createAccount(
                new AccountRequest("1020", "Bank Account", AccountType.ASSET, parentAcc.id(), true, false)
        );

        // Fetch tree
        List<AccountTreeNode> tree = accountService.getAccountTree();

        assertThat(tree).hasSize(1);
        AccountTreeNode root = tree.get(0);
        assertThat(root.code()).isEqualTo("1000");
        assertThat(root.header()).isTrue();
        assertThat(root.children()).hasSize(2);
        assertThat(root.children()).extracting(AccountTreeNode::code).containsExactlyInAnyOrder("1010", "1020");
    }

    private void enableTenantFilter(UUID tenantId) {
        try {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter(TenantScopedEntity.TENANT_FILTER_NAME)
                    .setParameter(TenantScopedEntity.TENANT_PARAM_NAME, tenantId);
        } catch (Exception ignored) {
        }
    }
}
