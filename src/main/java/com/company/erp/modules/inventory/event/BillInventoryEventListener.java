package com.company.erp.modules.inventory.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.service.InventoryService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.purchases.entity.Bill;
import com.company.erp.modules.purchases.entity.BillItem;
import com.company.erp.modules.purchases.event.BillRecordedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
public class BillInventoryEventListener {

    private final InventoryService inventoryService;

    public BillInventoryEventListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleBillRecorded(BillRecordedEvent event) {
        Bill bill = event.bill();
        Warehouse warehouse = bill.getWarehouse();
        if (warehouse == null) {
            return;
        }

        UUID orgId = bill.getOrganizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        for (BillItem line : bill.getItems()) {
            Item item = line.getItem();
            if (item != null && item.isTrackInventory()) {
                inventoryService.applyMovement(
                        item,
                        warehouse,
                        line.getQuantity(),
                        MovementType.PURCHASE,
                        "BILL",
                        bill.getId()
                );
            }
        }
    }
}
