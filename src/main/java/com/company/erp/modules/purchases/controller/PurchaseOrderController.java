package com.company.erp.modules.purchases.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.purchases.dto.PurchaseOrderRequest;
import com.company.erp.modules.purchases.dto.PurchaseOrderResponse;
import com.company.erp.modules.purchases.entity.PurchaseOrderStatus;
import com.company.erp.modules.purchases.service.PurchaseOrderService;
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
@RequestMapping("/api/v1/purchase-orders")
@Tag(name = "Purchase Orders", description = "Purchase Orders Management API")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @PostMapping
    @Operation(summary = "Create a new purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrderResponse created = purchaseOrderService.createPurchaseOrder(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase order created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order by ID")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getPurchaseOrderById(@PathVariable UUID id) {
        PurchaseOrderResponse order = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping
    @Operation(summary = "Get all purchase orders")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getAllPurchaseOrders() {
        List<PurchaseOrderResponse> orders = purchaseOrderService.getAllPurchaseOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> updatePurchaseOrder(
            @PathVariable UUID id,
            @Valid @RequestBody PurchaseOrderRequest request
    ) {
        PurchaseOrderResponse updated = purchaseOrderService.updatePurchaseOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Purchase order updated successfully", updated));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update purchase order status")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam PurchaseOrderStatus status
    ) {
        PurchaseOrderResponse updated = purchaseOrderService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Purchase order status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete purchase order by ID")
    public ResponseEntity<ApiResponse<Void>> deletePurchaseOrder(@PathVariable UUID id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase order deleted successfully", null));
    }
}
