package com.company.erp.modules.items.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.items.dto.UnitRequest;
import com.company.erp.modules.items.dto.UnitResponse;
import com.company.erp.modules.items.service.UnitService;
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
@RequestMapping("/api/v1/units")
@Tag(name = "Units", description = "Unit of Measure Management API")
public class UnitController {

    private final UnitService unitService;

    public UnitController(UnitService unitService) {
        this.unitService = unitService;
    }

    @PostMapping
    @Operation(summary = "Create unit of measure")
    public ResponseEntity<ApiResponse<UnitResponse>> createUnit(@Valid @RequestBody UnitRequest request) {
        UnitResponse created = unitService.createUnit(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Unit created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get unit by ID")
    public ResponseEntity<ApiResponse<UnitResponse>> getUnitById(@PathVariable UUID id) {
        UnitResponse unit = unitService.getUnitById(id);
        return ResponseEntity.ok(ApiResponse.success(unit));
    }

    @GetMapping
    @Operation(summary = "Get all units of measure")
    public ResponseEntity<ApiResponse<List<UnitResponse>>> getAllUnits() {
        List<UnitResponse> units = unitService.getAllUnits();
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update unit of measure")
    public ResponseEntity<ApiResponse<UnitResponse>> updateUnit(
            @PathVariable UUID id,
            @Valid @RequestBody UnitRequest request
    ) {
        UnitResponse updated = unitService.updateUnit(id, request);
        return ResponseEntity.ok(ApiResponse.success("Unit updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete unit of measure")
    public ResponseEntity<ApiResponse<Void>> deleteUnit(@PathVariable UUID id) {
        unitService.deleteUnit(id);
        return ResponseEntity.ok(ApiResponse.success("Unit deleted successfully", null));
    }
}
