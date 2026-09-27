package com.company.erp.modules.payments.service;

import com.company.erp.modules.payments.dto.PaymentMadeAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentMadeRequest;
import com.company.erp.modules.payments.dto.PaymentMadeResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PaymentMadeService {
    PaymentMadeResponse createPaymentMade(PaymentMadeRequest request);
    PaymentMadeResponse getPaymentMadeById(UUID id);
    List<PaymentMadeResponse> getAllPaymentsMade();
    PaymentMadeAllocationResponse allocate(UUID paymentId, UUID billId, BigDecimal amount, LocalDate allocationDate);
}
