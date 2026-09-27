package com.company.erp.modules.sales.event;

import com.company.erp.modules.sales.entity.Invoice;

public record InvoiceIssuedEvent(Invoice invoice) {
}
