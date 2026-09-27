package com.company.erp.modules.payments.repository;

import com.company.erp.modules.payments.entity.PaymentReceivedAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentReceivedAllocationRepository extends JpaRepository<PaymentReceivedAllocation, UUID> {

    List<PaymentReceivedAllocation> findByPaymentId(UUID paymentId);

    List<PaymentReceivedAllocation> findByInvoiceId(UUID invoiceId);

    @Query("SELECT COALESCE(SUM(a.allocatedAmount), 0) FROM PaymentReceivedAllocation a WHERE a.invoice.id = :invoiceId")
    BigDecimal sumAllocatedAmountByInvoiceId(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT COALESCE(SUM(a.allocatedAmount), 0) FROM PaymentReceivedAllocation a WHERE a.payment.id = :paymentId")
    BigDecimal sumAllocatedAmountByPaymentId(@Param("paymentId") UUID paymentId);
}
