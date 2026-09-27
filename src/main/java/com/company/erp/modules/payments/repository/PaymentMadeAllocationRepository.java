package com.company.erp.modules.payments.repository;

import com.company.erp.modules.payments.entity.PaymentMadeAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentMadeAllocationRepository extends JpaRepository<PaymentMadeAllocation, UUID> {

    List<PaymentMadeAllocation> findByPaymentId(UUID paymentId);

    List<PaymentMadeAllocation> findByBillId(UUID billId);

    @Query("SELECT COALESCE(SUM(a.allocatedAmount), 0) FROM PaymentMadeAllocation a WHERE a.bill.id = :billId")
    BigDecimal sumAllocatedAmountByBillId(@Param("billId") UUID billId);

    @Query("SELECT COALESCE(SUM(a.allocatedAmount), 0) FROM PaymentMadeAllocation a WHERE a.payment.id = :paymentId")
    BigDecimal sumAllocatedAmountByPaymentId(@Param("paymentId") UUID paymentId);
}
