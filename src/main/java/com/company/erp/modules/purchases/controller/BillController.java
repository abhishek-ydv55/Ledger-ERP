package com.company.erp.modules.purchases.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.entity.BillStatus;
import com.company.erp.modules.purchases.service.BillService;
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
@RequestMapping("/api/v1/bills")
@Tag(name = "Bills", description = "Vendor Bills & Purchasing API")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping
    @Operation(summary = "Create a new draft bill")
    public ResponseEntity<ApiResponse<BillResponse>> createBill(@Valid @RequestBody BillRequest request) {
        BillResponse created = billService.createBill(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill created successfully", created));
    }

    @PostMapping("/{id}/record")
    @Operation(summary = "Record bill (triggers accounting and inventory event listeners)")
    public ResponseEntity<ApiResponse<BillResponse>> recordBill(@PathVariable UUID id) {
        BillResponse recorded = billService.recordBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill recorded successfully", recorded));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bill by ID")
    public ResponseEntity<ApiResponse<BillResponse>> getBillById(@PathVariable UUID id) {
        BillResponse bill = billService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success(bill));
    }

    @GetMapping
    @Operation(summary = "Get all bills")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getAllBills() {
        List<BillResponse> bills = billService.getAllBills();
        return ResponseEntity.ok(ApiResponse.success(bills));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing bill")
    public ResponseEntity<ApiResponse<BillResponse>> updateBill(
            @PathVariable UUID id,
            @Valid @RequestBody BillRequest request
    ) {
        BillResponse updated = billService.updateBill(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bill updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update bill status")
    public ResponseEntity<ApiResponse<BillResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam BillStatus status
    ) {
        BillResponse updated = billService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Bill status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete bill by ID")
    public ResponseEntity<ApiResponse<Void>> deleteBill(@PathVariable UUID id) {
        billService.deleteBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill deleted successfully", null));
    }
}
