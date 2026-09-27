package com.company.erp.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AgedReportResponse(
        LocalDate asOfDate,
        List<AgedReportItemDto> items,
        BigDecimal currentTotal,
        BigDecimal days1To30Total,
        BigDecimal days31To60Total,
        BigDecimal days61To90Total,
        BigDecimal over90Total,
        BigDecimal grandTotal
) {
}
