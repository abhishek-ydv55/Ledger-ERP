package com.company.erp.modules.payments.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.payments.dto.PaymentMadeAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentMadeRequest;
import com.company.erp.modules.payments.dto.PaymentMadeResponse;
import com.company.erp.modules.payments.entity.PaymentMade;
import com.company.erp.modules.payments.entity.PaymentMadeAllocation;
import com.company.erp.modules.payments.event.PaymentAllocatedEvent;
import com.company.erp.modules.payments.repository.PaymentMadeAllocationRepository;
import com.company.erp.modules.payments.repository.PaymentMadeRepository;
import com.company.erp.modules.purchases.entity.Bill;
import com.company.erp.modules.purchases.entity.BillStatus;
import com.company.erp.modules.purchases.repository.BillRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentMadeServiceImpl implements PaymentMadeService {

    private final PaymentMadeRepository paymentMadeRepository;
    private final PaymentMadeAllocationRepository allocationRepository;
    private final BillRepository billRepository;
    private final PartyRepository partyRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final com.company.erp.modules.audit.service.AuditService auditService;

    public PaymentMadeServiceImpl(PaymentMadeRepository paymentMadeRepository,
                                  PaymentMadeAllocationRepository allocationRepository,
                                  BillRepository billRepository,
                                  PartyRepository partyRepository,
                                  BankAccountRepository bankAccountRepository,
                                  ApplicationEventPublisher eventPublisher,
                                  com.company.erp.modules.audit.service.AuditService auditService) {
        this.paymentMadeRepository = paymentMadeRepository;
        this.allocationRepository = allocationRepository;
        this.billRepository = billRepository;
        this.partyRepository = partyRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    @Override
    public PaymentMadeResponse createPaymentMade(PaymentMadeRequest request) {
        if (paymentMadeRepository.existsByPaymentNumber(request.paymentNumber())) {
            throw new BusinessRuleViolationException("Payment with number '" + request.paymentNumber() + "' already exists");
        }

        Party vendor = partyRepository.findById(request.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));

        BankAccount bankAccount = null;
        if (request.bankAccountId() != null) {
            bankAccount = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + request.bankAccountId()));
        }

        PaymentMade payment = new PaymentMade(
                vendor,
                bankAccount,
                request.paymentNumber(),
                request.paymentDate(),
                request.paymentMethod(),
                request.amount(),
                request.amount(), // Initially unallocated == amount
                request.referenceNumber(),
                request.notes()
        );
        payment.setOrganizationId(TenantContext.getTenantId());

        PaymentMade saved = paymentMadeRepository.save(payment);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentMadeResponse getPaymentMadeById(UUID id) {
        PaymentMade payment = paymentMadeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment made not found with id: " + id));
        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentMadeResponse> getAllPaymentsMade() {
        return paymentMadeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentMadeAllocationResponse allocate(UUID paymentId, UUID billId, BigDecimal amount, LocalDate allocationDate) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("Allocation amount must be greater than zero");
        }

        // 1. Lock bill row pessimistic write lock
        Bill bill = billRepository.findByIdForUpdate(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + billId));

        // 2. Lock payment row pessimistic write lock
        PaymentMade payment = paymentMadeRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment made not found with id: " + paymentId));

        // Vendor match check
        if (!bill.getVendor().getId().equals(payment.getVendor().getId())) {
            throw new BusinessRuleViolationException("Bill vendor does not match payment vendor");
        }

        // 3. Verify bill allocation sum
        BigDecimal currentBillAllocated = allocationRepository.sumAllocatedAmountByBillId(billId);
        BigDecimal newBillAllocatedTotal = currentBillAllocated.add(amount);
        if (newBillAllocatedTotal.compareTo(bill.getTotalAmount()) > 0) {
            throw new BusinessRuleViolationException("New allocation would push total allocated amount ("
                    + newBillAllocatedTotal + ") above bill total amount (" + bill.getTotalAmount() + ")");
        }

        // 4. Verify payment allocation sum
        BigDecimal currentPaymentAllocated = allocationRepository.sumAllocatedAmountByPaymentId(paymentId);
        BigDecimal newPaymentAllocatedTotal = currentPaymentAllocated.add(amount);
        if (newPaymentAllocatedTotal.compareTo(payment.getAmount()) > 0) {
            throw new BusinessRuleViolationException("New allocation would push total allocated amount ("
                    + newPaymentAllocatedTotal + ") above payment total amount (" + payment.getAmount() + ")");
        }

        LocalDate date = allocationDate != null ? allocationDate : LocalDate.now();

        // 5. Create allocation entity
        PaymentMadeAllocation allocation = new PaymentMadeAllocation(payment, bill, amount, date);
        PaymentMadeAllocation savedAllocation = allocationRepository.save(allocation);

        // 6. Update payment unallocated amount
        payment.setUnallocatedAmount(payment.getAmount().subtract(newPaymentAllocatedTotal));
        paymentMadeRepository.save(payment);

        // 7. Update bill amount_paid, balance_due, and status
        bill.setAmountPaid(newBillAllocatedTotal);
        bill.setBalanceDue(bill.getTotalAmount().subtract(newBillAllocatedTotal));

        if (bill.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            bill.setStatus(BillStatus.PAID);
        } else if (bill.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        }
        billRepository.save(bill);

        // 8. Publish event
        eventPublisher.publishEvent(new PaymentAllocatedEvent(
                savedAllocation.getId(),
                "PAYMENT_MADE",
                payment.getId(),
                "BILL",
                bill.getId(),
                payment.getBankAccount() != null ? payment.getBankAccount().getId() : null,
                amount,
                date,
                payment.getOrganizationId(),
                payment.getReferenceNumber()
        ));

        PaymentMadeAllocationResponse response = mapAllocationToResponse(savedAllocation);
        auditService.record("PAYMENT_MADE", payment.getId(), "ALLOCATE", null, response);
        return response;
    }

    private PaymentMadeResponse mapToResponse(PaymentMade payment) {
        List<PaymentMadeAllocationResponse> allocResponses = payment.getAllocations().stream()
                .map(this::mapAllocationToResponse)
                .collect(Collectors.toList());

        return new PaymentMadeResponse(
                payment.getId(),
                payment.getOrganizationId(),
                payment.getVendor() != null ? payment.getVendor().getId() : null,
                payment.getVendor() != null ? payment.getVendor().getName() : null,
                payment.getBankAccount() != null ? payment.getBankAccount().getId() : null,
                payment.getBankAccount() != null ? payment.getBankAccount().getAccountName() : null,
                payment.getPaymentNumber(),
                payment.getPaymentDate(),
                payment.getPaymentMethod(),
                payment.getAmount(),
                payment.getUnallocatedAmount(),
                payment.getReferenceNumber(),
                payment.getNotes(),
                allocResponses,
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private PaymentMadeAllocationResponse mapAllocationToResponse(PaymentMadeAllocation alloc) {
        return new PaymentMadeAllocationResponse(
                alloc.getId(),
                alloc.getPayment() != null ? alloc.getPayment().getId() : null,
                alloc.getBill() != null ? alloc.getBill().getId() : null,
                alloc.getBill() != null ? alloc.getBill().getBillNumber() : null,
                alloc.getAllocatedAmount(),
                alloc.getAllocationDate(),
                alloc.getCreatedAt(),
                alloc.getUpdatedAt()
        );
    }
}
