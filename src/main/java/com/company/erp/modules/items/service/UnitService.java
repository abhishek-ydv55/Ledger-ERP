package com.company.erp.modules.items.service;

import com.company.erp.modules.items.dto.UnitRequest;
import com.company.erp.modules.items.dto.UnitResponse;

import java.util.List;
import java.util.UUID;

public interface UnitService {
    UnitResponse createUnit(UnitRequest request);
    UnitResponse getUnitById(UUID id);
    List<UnitResponse> getAllUnits();
    UnitResponse updateUnit(UUID id, UnitRequest request);
    void deleteUnit(UUID id);
}
