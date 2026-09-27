package com.company.erp.modules.payments.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.banking.entity.BankAccount;
import com.company.erp.modules.banking.repository.BankAccountRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.payments.dto.PaymentReceivedAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentReceivedRequest;
import com.company.erp.modules.payments.dto.PaymentReceivedResponse;
import com.company.erp.modules.payments.entity.PaymentReceived;
import com.company.erp.modules.payments.entity.PaymentReceivedAllocation;
import com.company.erp.modules.payments.event.PaymentAllocatedEvent;
import com.company.erp.modules.payments.repository.PaymentReceivedAllocationRepository;
import com.company.erp.modules.payments.repository.PaymentReceivedRepository;
import com.company.erp.modules.sales.entity.Invoice;
import com.company.erp.modules.sales.entity.InvoiceStatus;
import com.company.erp.modules.sales.repository.InvoiceRepository;
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
public class PaymentReceivedServiceImpl implements PaymentReceivedService {

    private final PaymentReceivedRepository paymentReceivedRepository;
    private final PaymentReceivedAllocationRepository allocationRepository;
    private final InvoiceRepository invoiceRepository;
    private final PartyRepository partyRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final com.company.erp.modules.audit.service.AuditService auditService;

    public PaymentReceivedServiceImpl(PaymentReceivedRepository paymentReceivedRepository,
                                      PaymentReceivedAllocationRepository allocationRepository,
                                      InvoiceRepository invoiceRepository,
                                      PartyRepository partyRepository,
                                      BankAccountRepository bankAccountRepository,
                                      ApplicationEventPublisher eventPublisher,
                                      com.company.erp.modules.audit.service.AuditService auditService) {
        this.paymentReceivedRepository = paymentReceivedRepository;
        this.allocationRepository = allocationRepository;
        this.invoiceRepository = invoiceRepository;
        this.partyRepository = partyRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    @Override
    public PaymentReceivedResponse createPaymentReceived(PaymentReceivedRequest request) {
        if (paymentReceivedRepository.existsByPaymentNumber(request.paymentNumber())) {
            throw new BusinessRuleViolationException("Payment with number '" + request.paymentNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        BankAccount bankAccount = null;
        if (request.bankAccountId() != null) {
            bankAccount = bankAccountRepository.findById(request.bankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + request.bankAccountId()));
        }

        PaymentReceived payment = new PaymentReceived(
                customer,
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

        PaymentReceived saved = paymentReceivedRepository.save(payment);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentReceivedResponse getPaymentReceivedById(UUID id) {
        PaymentReceived payment = paymentReceivedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment received not found with id: " + id));
        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentReceivedResponse> getAllPaymentsReceived() {
        return paymentReceivedRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentReceivedAllocationResponse allocate(UUID paymentId, UUID invoiceId, BigDecimal amount, LocalDate allocationDate) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleViolationException("Allocation amount must be greater than zero");
        }

        // 1. Lock invoice row pessimistic write lock
        Invoice invoice = invoiceRepository.findByIdForUpdate(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        // 2. Lock payment row pessimistic write lock
        PaymentReceived payment = paymentReceivedRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment received not found with id: " + paymentId));

        // Customer match check
        if (!invoice.getCustomer().getId().equals(payment.getCustomer().getId())) {
            throw new BusinessRuleViolationException("Invoice customer does not match payment customer");
        }

        // 3. Verify invoice allocation sum
        BigDecimal currentInvoiceAllocated = allocationRepository.sumAllocatedAmountByInvoiceId(invoiceId);
        BigDecimal newInvoiceAllocatedTotal = currentInvoiceAllocated.add(amount);
        if (newInvoiceAllocatedTotal.compareTo(invoice.getTotalAmount()) > 0) {
            throw new BusinessRuleViolationException("New allocation would push total allocated amount ("
                    + newInvoiceAllocatedTotal + ") above invoice total amount (" + invoice.getTotalAmount() + ")");
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
        PaymentReceivedAllocation allocation = new PaymentReceivedAllocation(payment, invoice, amount, date);
        PaymentReceivedAllocation savedAllocation = allocationRepository.save(allocation);

        // 6. Update payment unallocated amount
        payment.setUnallocatedAmount(payment.getAmount().subtract(newPaymentAllocatedTotal));
        paymentReceivedRepository.save(payment);

        // 7. Update invoice amount_paid, balance_due, and status
        invoice.setAmountPaid(newInvoiceAllocatedTotal);
        invoice.setBalanceDue(invoice.getTotalAmount().subtract(newInvoiceAllocatedTotal));

        if (invoice.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else if (invoice.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }
        invoiceRepository.save(invoice);

        // 8. Publish event
        eventPublisher.publishEvent(new PaymentAllocatedEvent(
                savedAllocation.getId(),
                "PAYMENT_RECEIVED",
                payment.getId(),
                "INVOICE",
                invoice.getId(),
                payment.getBankAccount() != null ? payment.getBankAccount().getId() : null,
                amount,
                date,
                payment.getOrganizationId(),
                payment.getReferenceNumber()
        ));

        PaymentReceivedAllocationResponse response = mapAllocationToResponse(savedAllocation);
        auditService.record("PAYMENT_RECEIVED", payment.getId(), "ALLOCATE", null, response);
        return response;
    }

    private PaymentReceivedResponse mapToResponse(PaymentReceived payment) {
        List<PaymentReceivedAllocationResponse> allocResponses = payment.getAllocations().stream()
                .map(this::mapAllocationToResponse)
                .collect(Collectors.toList());

        return new PaymentReceivedResponse(
                payment.getId(),
                payment.getOrganizationId(),
                payment.getCustomer() != null ? payment.getCustomer().getId() : null,
                payment.getCustomer() != null ? payment.getCustomer().getName() : null,
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

    private PaymentReceivedAllocationResponse mapAllocationToResponse(PaymentReceivedAllocation alloc) {
        return new PaymentReceivedAllocationResponse(
                alloc.getId(),
                alloc.getPayment() != null ? alloc.getPayment().getId() : null,
                alloc.getInvoice() != null ? alloc.getInvoice().getId() : null,
                alloc.getInvoice() != null ? alloc.getInvoice().getInvoiceNumber() : null,
                alloc.getAllocatedAmount(),
                alloc.getAllocationDate(),
                alloc.getCreatedAt(),
                alloc.getUpdatedAt()
        );
    }
}
