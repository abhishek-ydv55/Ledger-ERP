package com.company.erp.modules.payments.service;

import com.company.erp.modules.payments.dto.PaymentReceivedAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentReceivedRequest;
import com.company.erp.modules.payments.dto.PaymentReceivedResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PaymentReceivedService {
    PaymentReceivedResponse createPaymentReceived(PaymentReceivedRequest request);
    PaymentReceivedResponse getPaymentReceivedById(UUID id);
    List<PaymentReceivedResponse> getAllPaymentsReceived();
    PaymentReceivedAllocationResponse allocate(UUID paymentId, UUID invoiceId, BigDecimal amount, LocalDate allocationDate);
}
