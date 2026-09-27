package com.company.erp.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AgedReportItemDto(
        UUID entityId,
        String documentNumber,
        UUID partyId,
        String partyName,
        LocalDate documentDate,
        LocalDate dueDate,
        BigDecimal totalAmount,
        BigDecimal amountPaid,
        BigDecimal balanceDue,
        long daysOverdue,
        String bucket
) {
}
