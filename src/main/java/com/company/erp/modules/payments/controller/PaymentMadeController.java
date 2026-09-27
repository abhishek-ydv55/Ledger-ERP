package com.company.erp.modules.payments.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.payments.dto.PaymentAllocationRequest;
import com.company.erp.modules.payments.dto.PaymentMadeAllocationResponse;
import com.company.erp.modules.payments.dto.PaymentMadeRequest;
import com.company.erp.modules.payments.dto.PaymentMadeResponse;
import com.company.erp.modules.payments.service.PaymentMadeService;
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
@RequestMapping({"/api/payments/made", "/api/v1/payments/made"})
@Tag(name = "Payments Made", description = "Vendor Payments & Bill Allocation API")
public class PaymentMadeController {

    private final PaymentMadeService paymentMadeService;

    public PaymentMadeController(PaymentMadeService paymentMadeService) {
        this.paymentMadeService = paymentMadeService;
    }

    @PostMapping
    @Operation(summary = "Create a vendor payment made")
    public ResponseEntity<ApiResponse<PaymentMadeResponse>> createPaymentMade(@Valid @RequestBody PaymentMadeRequest request) {
        PaymentMadeResponse created = paymentMadeService.createPaymentMade(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment made created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment made by ID")
    public ResponseEntity<ApiResponse<PaymentMadeResponse>> getPaymentMadeById(@PathVariable UUID id) {
        PaymentMadeResponse payment = paymentMadeService.getPaymentMadeById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @GetMapping
    @Operation(summary = "Get all payments made")
    public ResponseEntity<ApiResponse<List<PaymentMadeResponse>>> getAllPaymentsMade() {
        List<PaymentMadeResponse> payments = paymentMadeService.getAllPaymentsMade();
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @PostMapping("/{id}/allocate")
    @Operation(summary = "Allocate payment made against a bill")
    public ResponseEntity<ApiResponse<PaymentMadeAllocationResponse>> allocate(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentAllocationRequest request
    ) {
        PaymentMadeAllocationResponse allocation = paymentMadeService.allocate(
                id,
                request.billId(),
                request.amount(),
                request.allocationDate()
        );
        return ResponseEntity.ok(ApiResponse.success("Payment allocated successfully", allocation));
    }
}
