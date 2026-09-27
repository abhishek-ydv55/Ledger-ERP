package com.company.erp.modules.sales.service;

import com.company.erp.modules.sales.dto.SalesOrderRequest;
import com.company.erp.modules.sales.dto.SalesOrderResponse;
import com.company.erp.modules.sales.entity.SalesOrderStatus;

import java.util.List;
import java.util.UUID;

public interface SalesOrderService {
    SalesOrderResponse createSalesOrder(SalesOrderRequest request);
    SalesOrderResponse getSalesOrderById(UUID id);
    List<SalesOrderResponse> getAllSalesOrders();
    SalesOrderResponse updateSalesOrder(UUID id, SalesOrderRequest request);
    SalesOrderResponse updateStatus(UUID id, SalesOrderStatus status);
    void deleteSalesOrder(UUID id);
}
