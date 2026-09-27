-- =============================================================================
-- Flyway Database Migration: V3__items_and_parties_schema.sql
-- =============================================================================

-- 1. Item Categories table
CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_item_categories_org_name UNIQUE (organization_id, name)
);
CREATE INDEX IF NOT EXISTS idx_item_categories_org ON item_categories(organization_id);

-- 2. Units table (Unit of Measure)
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    symbol VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_units_org_code UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS idx_units_org ON units(organization_id);

-- 3. Tax Rates table
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    rate NUMERIC(7, 4) NOT NULL,
    code VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tax_rates_org_name UNIQUE (organization_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tax_rates_org ON tax_rates(organization_id);

-- 4. Alter Items table to reference category, unit, tax_rate
ALTER TABLE items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES item_categories(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS tax_rate_id UUID REFERENCES tax_rates(id);
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE items ALTER COLUMN unit_of_measure DROP NOT NULL;

-- 5. Parties table
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    tax_id VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_parties_org_code UNIQUE (organization_id, code)
);
CREATE INDEX IF NOT EXISTS idx_parties_org ON parties(organization_id);

-- 6. Party Roles table
CREATE TABLE IF NOT EXISTS party_roles (
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (party_id, role)
);
CREATE INDEX IF NOT EXISTS idx_party_roles_party ON party_roles(party_id);

-- 7. Party Contacts table
CREATE TABLE IF NOT EXISTS party_contacts (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    designation VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_party_contacts_party ON party_contacts(party_id);

-- 8. Party Addresses table
CREATE TABLE IF NOT EXISTS party_addresses (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    address_type VARCHAR(50) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_party_addresses_party ON party_addresses(party_id);
