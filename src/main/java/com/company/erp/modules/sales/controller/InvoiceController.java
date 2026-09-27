package com.company.erp.modules.sales.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.sales.dto.InvoiceRequest;
import com.company.erp.modules.sales.dto.InvoiceResponse;
import com.company.erp.modules.sales.entity.InvoiceStatus;
import com.company.erp.modules.sales.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoices", description = "Invoicing & Billing API")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    @Operation(summary = "Create a new draft invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        InvoiceResponse created = invoiceService.createInvoice(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice created successfully", created));
    }

    @PostMapping("/{id}/issue")
    @Operation(summary = "Issue invoice (triggers accounting and inventory event listeners)")
    public ResponseEntity<ApiResponse<InvoiceResponse>> issueInvoice(@PathVariable UUID id) {
        InvoiceResponse issued = invoiceService.issueInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice issued successfully", issued));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get invoice by ID")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable UUID id) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping
    @Operation(summary = "Get all invoices")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAllInvoices() {
        List<InvoiceResponse> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing invoice")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody InvoiceRequest request
    ) {
        InvoiceResponse updated = invoiceService.updateInvoice(id, request);
        return ResponseEntity.ok(ApiResponse.success("Invoice updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update invoice status")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam InvoiceStatus status
    ) {
        InvoiceResponse updated = invoiceService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Invoice status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete invoice by ID")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(@PathVariable UUID id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice deleted successfully", null));
    }
}
