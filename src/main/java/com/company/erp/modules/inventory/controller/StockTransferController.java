package com.company.erp.modules.inventory.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.inventory.dto.StockTransferRequest;
import com.company.erp.modules.inventory.dto.StockTransferResponse;
import com.company.erp.modules.inventory.service.InventoryService;
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
@RequestMapping("/api/v1/stock-transfers")
@Tag(name = "Stock Transfers", description = "Inter-warehouse Stock Transfer Management API")
public class StockTransferController {

    private final InventoryService inventoryService;

    public StockTransferController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    @Operation(summary = "Create a new stock transfer")
    public ResponseEntity<ApiResponse<StockTransferResponse>> createStockTransfer(@Valid @RequestBody StockTransferRequest request) {
        StockTransferResponse created = inventoryService.createStockTransfer(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock transfer created successfully", created));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete stock transfer and perform movements")
    public ResponseEntity<ApiResponse<StockTransferResponse>> completeStockTransfer(@PathVariable UUID id) {
        StockTransferResponse completed = inventoryService.completeStockTransfer(id);
        return ResponseEntity.ok(ApiResponse.success("Stock transfer completed successfully", completed));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock transfer by ID")
    public ResponseEntity<ApiResponse<StockTransferResponse>> getStockTransferById(@PathVariable UUID id) {
        StockTransferResponse transfer = inventoryService.getStockTransferById(id);
        return ResponseEntity.ok(ApiResponse.success(transfer));
    }

    @GetMapping
    @Operation(summary = "Get all stock transfers")
    public ResponseEntity<ApiResponse<List<StockTransferResponse>>> getAllStockTransfers() {
        List<StockTransferResponse> transfers = inventoryService.getAllStockTransfers();
        return ResponseEntity.ok(ApiResponse.success(transfers));
    }
}
