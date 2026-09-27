package com.company.erp.modules.items.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.items.dto.TaxRateRequest;
import com.company.erp.modules.items.dto.TaxRateResponse;
import com.company.erp.modules.items.service.TaxRateService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tax-rates")
@Tag(name = "Tax Rates", description = "Tax Rate Management API")
public class TaxRateController {

    private final TaxRateService taxRateService;

    public TaxRateController(TaxRateService taxRateService) {
        this.taxRateService = taxRateService;
    }

    @PostMapping
    @Operation(summary = "Create tax rate")
    public ResponseEntity<ApiResponse<TaxRateResponse>> createTaxRate(@Valid @RequestBody TaxRateRequest request) {
        TaxRateResponse created = taxRateService.createTaxRate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tax rate created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tax rate by ID")
    public ResponseEntity<ApiResponse<TaxRateResponse>> getTaxRateById(@PathVariable UUID id) {
        TaxRateResponse taxRate = taxRateService.getTaxRateById(id);
        return ResponseEntity.ok(ApiResponse.success(taxRate));
    }

    @GetMapping
    @Operation(summary = "Get all tax rates")
    public ResponseEntity<ApiResponse<List<TaxRateResponse>>> getAllTaxRates() {
        List<TaxRateResponse> taxRates = taxRateService.getAllTaxRates();
        return ResponseEntity.ok(ApiResponse.success(taxRates));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update tax rate")
    public ResponseEntity<ApiResponse<TaxRateResponse>> updateTaxRate(
            @PathVariable UUID id,
            @Valid @RequestBody TaxRateRequest request
    ) {
        TaxRateResponse updated = taxRateService.updateTaxRate(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tax rate updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete tax rate")
    public ResponseEntity<ApiResponse<Void>> deleteTaxRate(@PathVariable UUID id) {
        taxRateService.deleteTaxRate(id);
        return ResponseEntity.ok(ApiResponse.success("Tax rate deleted successfully", null));
    }
}
