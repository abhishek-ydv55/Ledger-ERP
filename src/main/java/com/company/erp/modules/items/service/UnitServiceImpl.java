package com.company.erp.modules.items.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.dto.UnitRequest;
import com.company.erp.modules.items.dto.UnitResponse;
import com.company.erp.modules.items.entity.Unit;
import com.company.erp.modules.items.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UnitServiceImpl implements UnitService {

    private final UnitRepository unitRepository;

    public UnitServiceImpl(UnitRepository unitRepository) {
        this.unitRepository = unitRepository;
    }

    @Override
    public UnitResponse createUnit(UnitRequest request) {
        if (unitRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Unit with code '" + request.code() + "' already exists");
        }

        Unit unit = new Unit();
        unit.setName(request.name());
        unit.setCode(request.code());
        unit.setSymbol(request.symbol());
        unit.setOrganizationId(TenantContext.getTenantId());

        Unit saved = unitRepository.save(unit);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UnitResponse getUnitById(UUID id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", "id", id));
        return mapToResponse(unit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitResponse> getAllUnits() {
        return unitRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public UnitResponse updateUnit(UUID id, UnitRequest request) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", "id", id));

        if (!unit.getCode().equals(request.code()) && unitRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Unit with code '" + request.code() + "' already exists");
        }

        unit.setName(request.name());
        unit.setCode(request.code());
        unit.setSymbol(request.symbol());

        Unit updated = unitRepository.save(unit);
        return mapToResponse(updated);
    }

    @Override
    public void deleteUnit(UUID id) {
        Unit unit = unitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", "id", id));
        unitRepository.delete(unit);
    }

    private UnitResponse mapToResponse(Unit unit) {
        return new UnitResponse(
                unit.getId(),
                unit.getOrganizationId(),
                unit.getName(),
                unit.getCode(),
                unit.getSymbol(),
                unit.getCreatedAt(),
                unit.getUpdatedAt()
        );
    }
}
