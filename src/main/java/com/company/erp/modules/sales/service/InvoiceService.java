package com.company.erp.modules.sales.service;

import com.company.erp.modules.sales.dto.InvoiceRequest;
import com.company.erp.modules.sales.dto.InvoiceResponse;
import com.company.erp.modules.sales.entity.InvoiceStatus;

import java.util.List;
import java.util.UUID;

public interface InvoiceService {
    InvoiceResponse createInvoice(InvoiceRequest request);
    InvoiceResponse getInvoiceById(UUID id);
    List<InvoiceResponse> getAllInvoices();
    InvoiceResponse updateInvoice(UUID id, InvoiceRequest request);
    InvoiceResponse updateStatus(UUID id, InvoiceStatus status);
    InvoiceResponse issueInvoice(UUID id);
    void deleteInvoice(UUID id);
}
