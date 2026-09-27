package com.company.erp.modules.items.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.dto.TaxRateRequest;
import com.company.erp.modules.items.dto.TaxRateResponse;
import com.company.erp.modules.items.entity.TaxRate;
import com.company.erp.modules.items.repository.TaxRateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class TaxRateServiceImpl implements TaxRateService {

    private final TaxRateRepository taxRateRepository;

    public TaxRateServiceImpl(TaxRateRepository taxRateRepository) {
        this.taxRateRepository = taxRateRepository;
    }

    @Override
    public TaxRateResponse createTaxRate(TaxRateRequest request) {
        if (taxRateRepository.existsByName(request.name())) {
            throw new BusinessRuleViolationException("Tax rate with name '" + request.name() + "' already exists");
        }

        TaxRate taxRate = new TaxRate();
        taxRate.setName(request.name());
        taxRate.setRate(request.rate());
        taxRate.setCode(request.code());
        if (request.active() != null) {
            taxRate.setActive(request.active());
        }
        taxRate.setOrganizationId(TenantContext.getTenantId());

        TaxRate saved = taxRateRepository.save(taxRate);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public TaxRateResponse getTaxRateById(UUID id) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaxRate", "id", id));
        return mapToResponse(taxRate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaxRateResponse> getAllTaxRates() {
        return taxRateRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public TaxRateResponse updateTaxRate(UUID id, TaxRateRequest request) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaxRate", "id", id));

        if (!taxRate.getName().equals(request.name()) && taxRateRepository.existsByName(request.name())) {
            throw new BusinessRuleViolationException("Tax rate with name '" + request.name() + "' already exists");
        }

        taxRate.setName(request.name());
        taxRate.setRate(request.rate());
        taxRate.setCode(request.code());
        if (request.active() != null) {
            taxRate.setActive(request.active());
        }

        TaxRate updated = taxRateRepository.save(taxRate);
        return mapToResponse(updated);
    }

    @Override
    public void deleteTaxRate(UUID id) {
        TaxRate taxRate = taxRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaxRate", "id", id));
        taxRateRepository.delete(taxRate);
    }

    private TaxRateResponse mapToResponse(TaxRate taxRate) {
        return new TaxRateResponse(
                taxRate.getId(),
                taxRate.getOrganizationId(),
                taxRate.getName(),
                taxRate.getRate(),
                taxRate.getCode(),
                taxRate.isActive(),
                taxRate.getCreatedAt(),
                taxRate.getUpdatedAt()
        );
    }
}
