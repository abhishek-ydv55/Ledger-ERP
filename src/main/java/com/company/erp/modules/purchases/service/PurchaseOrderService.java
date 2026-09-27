package com.company.erp.modules.purchases.service;

import com.company.erp.modules.purchases.dto.PurchaseOrderRequest;
import com.company.erp.modules.purchases.dto.PurchaseOrderResponse;
import com.company.erp.modules.purchases.entity.PurchaseOrderStatus;

import java.util.List;
import java.util.UUID;

public interface PurchaseOrderService {
    PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request);
    PurchaseOrderResponse getPurchaseOrderById(UUID id);
    List<PurchaseOrderResponse> getAllPurchaseOrders();
    PurchaseOrderResponse updatePurchaseOrder(UUID id, PurchaseOrderRequest request);
    PurchaseOrderResponse updateStatus(UUID id, PurchaseOrderStatus status);
    void deletePurchaseOrder(UUID id);
}
