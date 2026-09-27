package com.company.erp.modules.inventory.event;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.entity.MovementType;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.service.InventoryService;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.sales.entity.Invoice;
import com.company.erp.modules.sales.entity.InvoiceItem;
import com.company.erp.modules.sales.event.InvoiceIssuedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
public class InvoiceInventoryEventListener {

    private final InventoryService inventoryService;

    public InvoiceInventoryEventListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleInvoiceIssued(InvoiceIssuedEvent event) {
        Invoice invoice = event.invoice();
        Warehouse warehouse = invoice.getWarehouse();
        if (warehouse == null) {
            return;
        }

        UUID orgId = invoice.getOrganizationId();
        if (orgId != null && TenantContext.getTenantId() == null) {
            TenantContext.setTenantId(orgId);
        }

        for (InvoiceItem line : invoice.getItems()) {
            Item item = line.getItem();
            if (item != null && item.isTrackInventory()) {
                inventoryService.applyMovement(
                        item,
                        warehouse,
                        line.getQuantity().negate(),
                        MovementType.SALE,
                        "INVOICE",
                        invoice.getId()
                );
            }
        }
    }
}
