package com.company.erp.modules.inventory.service;

import com.company.erp.modules.inventory.dto.WarehouseRequest;
import com.company.erp.modules.inventory.dto.WarehouseResponse;

import java.util.List;
import java.util.UUID;

public interface WarehouseService {
    WarehouseResponse createWarehouse(WarehouseRequest request);
    WarehouseResponse getWarehouseById(UUID id);
    List<WarehouseResponse> getAllWarehouses();
    WarehouseResponse updateWarehouse(UUID id, WarehouseRequest request);
    void deleteWarehouse(UUID id);
}
