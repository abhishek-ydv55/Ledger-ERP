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
@RequestMapping({"/api/v1/customers", "/api/customers"})
@Tag(name = "Customers", description = "Customer Party Management API")
public class CustomerController {

    private final PartyService partyService;

    public CustomerController(PartyService partyService) {
        this.partyService = partyService;
    }

    @PostMapping
    @Operation(summary = "Create a customer")
    public ResponseEntity<ApiResponse<PartyResponse>> createCustomer(@Valid @RequestBody PartyRequest request) {
        PartyResponse created = partyService.createParty(request, PartyRole.CUSTOMER);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID")
    public ResponseEntity<ApiResponse<PartyResponse>> getCustomerById(@PathVariable UUID id) {
        PartyResponse customer = partyService.getPartyById(id, PartyRole.CUSTOMER);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @GetMapping
    @Operation(summary = "Get all customers")
    public ResponseEntity<ApiResponse<List<PartyResponse>>> getAllCustomers() {
        List<PartyResponse> customers = partyService.getAllParties(PartyRole.CUSTOMER);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer")
    public ResponseEntity<ApiResponse<PartyResponse>> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody PartyRequest request
    ) {
        PartyResponse updated = partyService.updateParty(id, request, PartyRole.CUSTOMER);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        partyService.deleteParty(id, PartyRole.CUSTOMER);
        return ResponseEntity.ok(ApiResponse.success("Customer deleted successfully", null));
    }
}
