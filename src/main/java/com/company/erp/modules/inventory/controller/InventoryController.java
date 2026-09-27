package com.company.erp.modules.inventory.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.inventory.dto.InventoryMovementResponse;
import com.company.erp.modules.inventory.dto.InventoryStockResponse;
import com.company.erp.modules.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Stock Snapshot & Movement Ledger API")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/stock")
    @Operation(summary = "Get current stock levels (optionally filtered by warehouse)")
    public ResponseEntity<ApiResponse<List<InventoryStockResponse>>> getStock(
            @RequestParam(required = false) UUID warehouseId
    ) {
        List<InventoryStockResponse> stock = warehouseId != null
                ? inventoryService.getStockByWarehouse(warehouseId)
                : inventoryService.getAllStock();
        return ResponseEntity.ok(ApiResponse.success(stock));
    }

    @GetMapping("/movements")
    @Operation(summary = "Get inventory movements for a specific warehouse and item")
    public ResponseEntity<ApiResponse<List<InventoryMovementResponse>>> getMovements(
            @RequestParam UUID warehouseId,
            @RequestParam UUID itemId
    ) {
        List<InventoryMovementResponse> movements = inventoryService.getMovementsByWarehouseAndItem(warehouseId, itemId);
        return ResponseEntity.ok(ApiResponse.success(movements));
    }
}
