package com.company.erp.modules.sales.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.sales.dto.SalesOrderRequest;
import com.company.erp.modules.sales.dto.SalesOrderResponse;
import com.company.erp.modules.sales.entity.SalesOrderStatus;
import com.company.erp.modules.sales.service.SalesOrderService;
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
@RequestMapping("/api/v1/sales-orders")
@Tag(name = "Sales Orders", description = "Sales Orders Management API")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @PostMapping
    @Operation(summary = "Create a new sales order")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> createSalesOrder(@Valid @RequestBody SalesOrderRequest request) {
        SalesOrderResponse created = salesOrderService.createSalesOrder(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sales order created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sales order by ID")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> getSalesOrderById(@PathVariable UUID id) {
        SalesOrderResponse salesOrder = salesOrderService.getSalesOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(salesOrder));
    }

    @GetMapping
    @Operation(summary = "Get all sales orders")
    public ResponseEntity<ApiResponse<List<SalesOrderResponse>>> getAllSalesOrders() {
        List<SalesOrderResponse> salesOrders = salesOrderService.getAllSalesOrders();
        return ResponseEntity.ok(ApiResponse.success(salesOrders));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing sales order")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> updateSalesOrder(
            @PathVariable UUID id,
            @Valid @RequestBody SalesOrderRequest request
    ) {
        SalesOrderResponse updated = salesOrderService.updateSalesOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sales order updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update sales order status")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam SalesOrderStatus status
    ) {
        SalesOrderResponse updated = salesOrderService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Sales order status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete sales order by ID")
    public ResponseEntity<ApiResponse<Void>> deleteSalesOrder(@PathVariable UUID id) {
        salesOrderService.deleteSalesOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Sales order deleted successfully", null));
    }
}
