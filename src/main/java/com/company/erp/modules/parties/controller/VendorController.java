package com.company.erp.modules.parties.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.parties.dto.PartyRequest;
import com.company.erp.modules.parties.dto.PartyResponse;
import com.company.erp.modules.parties.entity.PartyRole;
import com.company.erp.modules.parties.service.PartyService;
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
@RequestMapping({"/api/v1/vendors", "/api/vendors"})
@Tag(name = "Vendors", description = "Vendor Party Management API")
public class VendorController {

    private final PartyService partyService;

    public VendorController(PartyService partyService) {
        this.partyService = partyService;
    }

    @PostMapping
    @Operation(summary = "Create a vendor")
    public ResponseEntity<ApiResponse<PartyResponse>> createVendor(@Valid @RequestBody PartyRequest request) {
        PartyResponse created = partyService.createParty(request, PartyRole.VENDOR);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vendor created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vendor by ID")
    public ResponseEntity<ApiResponse<PartyResponse>> getVendorById(@PathVariable UUID id) {
        PartyResponse vendor = partyService.getPartyById(id, PartyRole.VENDOR);
        return ResponseEntity.ok(ApiResponse.success(vendor));
    }

    @GetMapping
    @Operation(summary = "Get all vendors")
    public ResponseEntity<ApiResponse<List<PartyResponse>>> getAllVendors() {
        List<PartyResponse> vendors = partyService.getAllParties(PartyRole.VENDOR);
        return ResponseEntity.ok(ApiResponse.success(vendors));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update vendor")
    public ResponseEntity<ApiResponse<PartyResponse>> updateVendor(
            @PathVariable UUID id,
            @Valid @RequestBody PartyRequest request
    ) {
        PartyResponse updated = partyService.updateParty(id, request, PartyRole.VENDOR);
        return ResponseEntity.ok(ApiResponse.success("Vendor updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vendor")
    public ResponseEntity<ApiResponse<Void>> deleteVendor(@PathVariable UUID id) {
        partyService.deleteParty(id, PartyRole.VENDOR);
        return ResponseEntity.ok(ApiResponse.success("Vendor deleted successfully", null));
    }
}
