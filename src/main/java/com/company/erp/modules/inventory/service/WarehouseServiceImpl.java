package com.company.erp.modules.inventory.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.dto.WarehouseRequest;
import com.company.erp.modules.inventory.dto.WarehouseResponse;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseServiceImpl(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Warehouse with code '" + request.code() + "' already exists");
        }

        Warehouse warehouse = new Warehouse(
                request.name(),
                request.code(),
                request.location(),
                request.active() != null ? request.active() : true
        );
        warehouse.setOrganizationId(TenantContext.getTenantId());

        Warehouse saved = warehouseRepository.save(warehouse);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouseById(UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + id));
        return mapToResponse(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public WarehouseResponse updateWarehouse(UUID id, WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + id));

        if (!warehouse.getCode().equals(request.code()) && warehouseRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Warehouse with code '" + request.code() + "' already exists");
        }

        warehouse.setName(request.name());
        warehouse.setCode(request.code());
        warehouse.setLocation(request.location());
        if (request.active() != null) {
            warehouse.setActive(request.active());
        }

        Warehouse updated = warehouseRepository.save(warehouse);
        return mapToResponse(updated);
    }

    @Override
    public void deleteWarehouse(UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + id));
        warehouseRepository.delete(warehouse);
    }

    private WarehouseResponse mapToResponse(Warehouse warehouse) {
        return new WarehouseResponse(
                warehouse.getId(),
                warehouse.getOrganizationId(),
                warehouse.getName(),
                warehouse.getCode(),
                warehouse.getLocation(),
                warehouse.isActive(),
                warehouse.getCreatedAt(),
                warehouse.getUpdatedAt()
        );
    }
}
