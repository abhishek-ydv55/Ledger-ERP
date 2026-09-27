package com.company.erp.modules.purchases.service;

import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.entity.BillStatus;

import java.util.List;
import java.util.UUID;

public interface BillService {
    BillResponse createBill(BillRequest request);
    BillResponse getBillById(UUID id);
    List<BillResponse> getAllBills();
    BillResponse updateBill(UUID id, BillRequest request);
    BillResponse updateStatus(UUID id, BillStatus status);
    BillResponse recordBill(UUID id);
    void deleteBill(UUID id);
}
