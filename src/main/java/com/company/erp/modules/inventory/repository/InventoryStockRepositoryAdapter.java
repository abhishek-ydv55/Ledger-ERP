package com.company.erp.modules.inventory.repository;

import com.company.erp.modules.inventory.entity.InventoryStock;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class InventoryStockRepositoryAdapter {

    private final InventoryStockRepository repository;

    public InventoryStockRepositoryAdapter(InventoryStockRepository repository) {
        this.repository = repository;
    }

    public Optional<InventoryStock> findByWarehouseIdAndItemId(UUID warehouseId, UUID itemId) {
        return repository.findByWarehouseIdAndItemId(warehouseId, itemId);
    }

    public List<InventoryStock> findByWarehouseId(UUID warehouseId) {
        return repository.findByWarehouseId(warehouseId);
    }

    public List<InventoryStock> findAll() {
        return repository.findAll();
    }

    public void upsertStock(UUID orgId, UUID warehouseId, UUID itemId, BigDecimal delta) {
        UUID newId = UUID.randomUUID();
        repository.upsertStockQuantity(newId, orgId, warehouseId, itemId, delta);
    }
}
