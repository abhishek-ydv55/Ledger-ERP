package com.company.erp.modules.inventory.repository;

import com.company.erp.modules.inventory.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    List<InventoryMovement> findByWarehouseIdAndItemId(UUID warehouseId, UUID itemId);
    List<InventoryMovement> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);
}
