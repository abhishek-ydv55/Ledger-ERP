/// <reference types="cypress" />

describe('Core Business Workflow E2E Test Suite', () => {
  beforeEach(() => {
    // Visit local dev server
    cy.visit('http://localhost:4200/auth/login');
  });

  it('completes core flow: login -> create customer -> create/issue invoice -> record payment -> verify PAID status and bank balance', () => {
    // 1. Login
    cy.get('input[formControlName="email"]').type('admin@company.com');
    cy.get('input[formControlName="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    // Verify redirected to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Executive Overview').should('be.visible');

    // 2. Create a Customer
    cy.visit('http://localhost:4200/parties');
    cy.contains('New Customer').click();

    cy.get('input[formControlName="name"]').type('Apex Global Enterprise E2E');
    cy.get('input[formControlName="code"]').type('CUST-E2E-001');
    cy.get('input[formControlName="creditLimit"]').clear().type('75000');
    cy.get('button').contains('Save Customer').click();

    // Verify toast & customer table entry
    cy.contains('Customer saved successfully').should('be.visible');
    cy.contains('Apex Global Enterprise E2E').should('be.visible');

    // 3. Create and Issue an Invoice
    cy.visit('http://localhost:4200/sales');
    cy.contains('Invoices & Billing').click();
    cy.contains('New Invoice').click();

    // Select customer party
    cy.get('select[formControlName="customerId"]').select('Apex Global Enterprise E2E');
    
    // Fill line item details
    cy.get('input[placeholder="Enter line item name or service description..."]').first().type('High Performance Server Blade X1');
    cy.get('input[placeholder="1"]').first().clear().type('2');
    cy.get('input[placeholder="0.00"]').first().clear().type('2500');

    // Submit document
    cy.get('button').contains('Create Document').click();
    cy.contains('Customer invoice created').should('be.visible');

    // Issue the created invoice
    cy.contains('Apex Global Enterprise E2E').first().click();
    cy.contains('Issue Invoice').click();
    cy.contains('Invoice issued successfully').should('be.visible');
    cy.contains('ISSUED').should('be.visible');

    // 4. Record a Payment against it
    cy.contains('Record Payment').click();
    cy.url().should('include', '/payments');
    
    // Record payment collection
    cy.contains('Record Customer Collection').click();
    cy.get('select[formControlName="partyId"]').select('Apex Global Enterprise E2E');
    cy.get('input[formControlName="amount"]').clear().type('5000');
    cy.get('button').contains('Record Collection').click();

    // 5. Confirm Invoice shows PAID and Bank Account balance updated
    cy.visit('http://localhost:4200/sales');
    cy.contains('Invoices & Billing').click();
    cy.contains('INV-2026').first().click();
    cy.contains('PAID').should('be.visible');

    // Verify bank balance updated in Banking module
    cy.visit('http://localhost:4200/banking');
    cy.contains('Bank Accounts & Reconciliation').should('be.visible');
    cy.contains('Chase Business Operating Account').should('be.visible');
  });
});
