package com.company.erp.modules.inventory.repository;

import com.company.erp.modules.inventory.entity.InventoryStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface InventoryStockRepository extends JpaRepository<InventoryStock, UUID> {

    Optional<InventoryStock> findByWarehouseIdAndItemId(UUID warehouseId, UUID itemId);

    List<InventoryStock> findByWarehouseId(UUID warehouseId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        INSERT INTO inventory_stock (id, organization_id, warehouse_id, item_id, quantity, created_at, updated_at)
        VALUES (:id, :orgId, :warehouseId, :itemId, :delta, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, warehouse_id, item_id)
        DO UPDATE SET quantity = inventory_stock.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
    """, nativeQuery = true)
    int upsertStockQuantity(
        @Param("id") UUID id,
        @Param("orgId") UUID orgId,
        @Param("warehouseId") UUID warehouseId,
        @Param("itemId") UUID itemId,
        @Param("delta") BigDecimal delta
    );
}

