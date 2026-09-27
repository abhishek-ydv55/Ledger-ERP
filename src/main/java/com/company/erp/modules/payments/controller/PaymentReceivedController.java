package com.company.erp.modules.payments.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.payments.dto.PaymentAllocationRequest;
import com.company.erp.modules.payments.dto.PaymentReceivedAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentReceivedRequest;
import com.company.erp.modules.payments.dto.PaymentReceivedResponse;
import com.company.erp.modules.payments.service.PaymentReceivedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/payments/received", "/api/v1/payments/received"})
@Tag(name = "Payments Received", description = "Customer Payments & Invoice Allocation API")
public class PaymentReceivedController {

    private final PaymentReceivedService paymentReceivedService;

    public PaymentReceivedController(PaymentReceivedService paymentReceivedService) {
        this.paymentReceivedService = paymentReceivedService;
    }

    @PostMapping
    @Operation(summary = "Create a customer payment received")
    public ResponseEntity<ApiResponse<PaymentReceivedResponse>> createPaymentReceived(@Valid @RequestBody PaymentReceivedRequest request) {
        PaymentReceivedResponse created = paymentReceivedService.createPaymentReceived(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment received created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment received by ID")
    public ResponseEntity<ApiResponse<PaymentReceivedResponse>> getPaymentReceivedById(@PathVariable UUID id) {
        PaymentReceivedResponse payment = paymentReceivedService.getPaymentReceivedById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @GetMapping
    @Operation(summary = "Get all payments received")
    public ResponseEntity<ApiResponse<List<PaymentReceivedResponse>>> getAllPaymentsReceived() {
        List<PaymentReceivedResponse> payments = paymentReceivedService.getAllPaymentsReceived();
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @PostMapping("/{id}/allocate")
    @Operation(summary = "Allocate payment received against an invoice")
    public ResponseEntity<ApiResponse<PaymentReceivedAllocationResponse>> allocate(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentAllocationRequest request
    ) {
        PaymentReceivedAllocationResponse allocation = paymentReceivedService.allocate(
                id,
                request.invoiceId(),
                request.amount(),
                request.allocationDate()
        );
        return ResponseEntity.ok(ApiResponse.success("Payment allocated successfully", allocation));
    }
}
