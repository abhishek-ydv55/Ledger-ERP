package com.company.erp.modules.payments.entity;

import com.company.erp.common.domain.BaseEntity;
import com.company.erp.modules.sales.entity.Invoice;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payment_received_allocations")
public class PaymentReceivedAllocation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private PaymentReceived payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "allocated_amount", nullable = false)
    private BigDecimal allocatedAmount = BigDecimal.ZERO;

    @Column(name = "allocation_date", nullable = false)
    private LocalDate allocationDate;

    public PaymentReceivedAllocation() {
    }

    public PaymentReceivedAllocation(PaymentReceived payment, Invoice invoice, BigDecimal allocatedAmount, LocalDate allocationDate) {
        this.payment = payment;
        this.invoice = invoice;
        this.allocatedAmount = allocatedAmount;
        this.allocationDate = allocationDate;
    }

    public PaymentReceived getPayment() {
        return payment;
    }

    public void setPayment(PaymentReceived payment) {
        this.payment = payment;
    }

    public Invoice getInvoice() {
        return invoice;
    }

    public void setInvoice(Invoice invoice) {
        this.invoice = invoice;
    }

    public BigDecimal getAllocatedAmount() {
        return allocatedAmount;
    }

    public void setAllocatedAmount(BigDecimal allocatedAmount) {
        this.allocatedAmount = allocatedAmount;
    }

    public LocalDate getAllocationDate() {
        return allocationDate;
    }

    public void setAllocationDate(LocalDate allocationDate) {
        this.allocationDate = allocationDate;
    }
}
