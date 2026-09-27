package com.company.erp.modules.items.service;

import com.company.erp.modules.items.dto.TaxRateRequest;
import com.company.erp.modules.items.dto.TaxRateResponse;

import java.util.List;
import java.util.UUID;

public interface TaxRateService {
    TaxRateResponse createTaxRate(TaxRateRequest request);
    TaxRateResponse getTaxRateById(UUID id);
    List<TaxRateResponse> getAllTaxRates();
    TaxRateResponse updateTaxRate(UUID id, TaxRateRequest request);
    void deleteTaxRate(UUID id);
}
