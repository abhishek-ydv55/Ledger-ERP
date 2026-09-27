package com.company.erp.modules.sales.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.sales.dto.EstimateRequest;
import com.company.erp.modules.sales.dto.EstimateResponse;
import com.company.erp.modules.sales.entity.EstimateStatus;
import com.company.erp.modules.sales.service.EstimateService;
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
@RequestMapping("/api/v1/estimates")
@Tag(name = "Estimates", description = "Sales Quotations / Estimates API")
public class EstimateController {

    private final EstimateService estimateService;

    public EstimateController(EstimateService estimateService) {
        this.estimateService = estimateService;
    }

    @PostMapping
    @Operation(summary = "Create a new estimate")
    public ResponseEntity<ApiResponse<EstimateResponse>> createEstimate(@Valid @RequestBody EstimateRequest request) {
        EstimateResponse created = estimateService.createEstimate(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Estimate created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get estimate by ID")
    public ResponseEntity<ApiResponse<EstimateResponse>> getEstimateById(@PathVariable UUID id) {
        EstimateResponse estimate = estimateService.getEstimateById(id);
        return ResponseEntity.ok(ApiResponse.success(estimate));
    }

    @GetMapping
    @Operation(summary = "Get all estimates")
    public ResponseEntity<ApiResponse<List<EstimateResponse>>> getAllEstimates() {
        List<EstimateResponse> estimates = estimateService.getAllEstimates();
        return ResponseEntity.ok(ApiResponse.success(estimates));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing estimate")
    public ResponseEntity<ApiResponse<EstimateResponse>> updateEstimate(
            @PathVariable UUID id,
            @Valid @RequestBody EstimateRequest request
    ) {
        EstimateResponse updated = estimateService.updateEstimate(id, request);
        return ResponseEntity.ok(ApiResponse.success("Estimate updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update estimate status")
    public ResponseEntity<ApiResponse<EstimateResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam EstimateStatus status
    ) {
        EstimateResponse updated = estimateService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Estimate status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete estimate by ID")
    public ResponseEntity<ApiResponse<Void>> deleteEstimate(@PathVariable UUID id) {
        estimateService.deleteEstimate(id);
        return ResponseEntity.ok(ApiResponse.success("Estimate deleted successfully", null));
    }
}
