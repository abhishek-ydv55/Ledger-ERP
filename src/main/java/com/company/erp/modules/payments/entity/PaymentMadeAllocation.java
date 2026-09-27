package com.company.erp.modules.payments.entity;

import com.company.erp.common.domain.BaseEntity;
import com.company.erp.modules.purchases.entity.Bill;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payment_made_allocations")
public class PaymentMadeAllocation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private PaymentMade payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @Column(name = "allocated_amount", nullable = false)
    private BigDecimal allocatedAmount = BigDecimal.ZERO;

    @Column(name = "allocation_date", nullable = false)
    private LocalDate allocationDate;

    public PaymentMadeAllocation() {
    }

    public PaymentMadeAllocation(PaymentMade payment, Bill bill, BigDecimal allocatedAmount, LocalDate allocationDate) {
        this.payment = payment;
        this.bill = bill;
        this.allocatedAmount = allocatedAmount;
        this.allocationDate = allocationDate;
    }

    public PaymentMade getPayment() {
        return payment;
    }

    public void setPayment(PaymentMade payment) {
        this.payment = payment;
    }

    public Bill getBill() {
        return bill;
    }

    public void setBill(Bill bill) {
        this.bill = bill;
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
