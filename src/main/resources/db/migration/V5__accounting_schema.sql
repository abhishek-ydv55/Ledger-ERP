-- =============================================================================
-- Flyway Database Migration: V5__accounting_schema.sql
-- =============================================================================

-- 1. Chart of Accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_header BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_chart_of_accounts_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_org ON chart_of_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_id);

-- 2. Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    entry_number VARCHAR(100) NOT NULL,
    entry_date DATE NOT NULL,
    description VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    source_type VARCHAR(100),
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_journal_entries_org_num UNIQUE (organization_id, entry_number)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_org ON journal_entries(organization_id);

-- 3. Journal Entry Lines table
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit NUMERIC(19, 4) NOT NULL DEFAULT 0,
    credit NUMERIC(19, 4) NOT NULL DEFAULT 0,
    memo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_debit_positive CHECK (debit >= 0),
    CONSTRAINT chk_credit_positive CHECK (credit >= 0),
    CONSTRAINT chk_debit_or_credit CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0))
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
