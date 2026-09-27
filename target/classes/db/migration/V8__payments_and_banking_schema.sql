-- =============================================================================
-- Flyway Database Migration: V8__payments_and_banking_schema.sql
-- =============================================================================

-- Add amount_paid and balance_due to invoices and bills if missing
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(19, 4) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due NUMERIC(19, 4) NOT NULL DEFAULT 0;

ALTER TABLE bills ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(19, 4) NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS balance_due NUMERIC(19, 4) NOT NULL DEFAULT 0;

-- 1. Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    bank_name VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    opening_balance NUMERIC(19, 4) NOT NULL DEFAULT 0,
    current_balance NUMERIC(19, 4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_bank_accounts_org_num UNIQUE (organization_id, account_number)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_org ON bank_accounts(organization_id);

-- 2. Bank Transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    description VARCHAR(500),
    source_type VARCHAR(100),
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_org ON bank_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);

-- 3. Payments Received table
CREATE TABLE IF NOT EXISTS payments_received (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    customer_id UUID NOT NULL REFERENCES parties(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    unallocated_amount NUMERIC(19, 4) NOT NULL,
    reference_number VARCHAR(100),
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payments_received_org_num UNIQUE (organization_id, payment_number)
);

CREATE INDEX IF NOT EXISTS idx_payments_received_org ON payments_received(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_customer ON payments_received(customer_id);

-- 4. Payment Received Allocations table
CREATE TABLE IF NOT EXISTS payment_received_allocations (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments_received(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    allocated_amount NUMERIC(19, 4) NOT NULL,
    allocation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pay_rec_alloc_payment ON payment_received_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_pay_rec_alloc_invoice ON payment_received_allocations(invoice_id);

-- 5. Payments Made table
CREATE TABLE IF NOT EXISTS payments_made (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    vendor_id UUID NOT NULL REFERENCES parties(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    unallocated_amount NUMERIC(19, 4) NOT NULL,
    reference_number VARCHAR(100),
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payments_made_org_num UNIQUE (organization_id, payment_number)
);

CREATE INDEX IF NOT EXISTS idx_payments_made_org ON payments_made(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_made_vendor ON payments_made(vendor_id);

-- 6. Payment Made Allocations table
CREATE TABLE IF NOT EXISTS payment_made_allocations (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments_made(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id),
    allocated_amount NUMERIC(19, 4) NOT NULL,
    allocation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pay_made_alloc_payment ON payment_made_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_pay_made_alloc_bill ON payment_made_allocations(bill_id);
