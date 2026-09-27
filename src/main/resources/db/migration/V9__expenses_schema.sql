-- =============================================================================
-- Flyway Database Migration: V9__expenses_schema.sql
-- =============================================================================

-- 1. Expense Categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_expense_categories_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON expense_categories(organization_id);

-- 2. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    vendor_id UUID REFERENCES parties(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    expense_number VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    tax_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(19, 4) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_expenses_org_num UNIQUE (organization_id, expense_number)
);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_bank_account ON expenses(bank_account_id);
