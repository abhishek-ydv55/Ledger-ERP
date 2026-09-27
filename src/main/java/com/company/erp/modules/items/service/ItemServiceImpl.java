package com.company.erp.modules.items.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.dto.ItemCategoryResponse;
import com.company.erp.modules.items.dto.ItemRequest;
import com.company.erp.modules.items.dto.ItemResponse;
import com.company.erp.modules.items.dto.TaxRateResponse;
import com.company.erp.modules.items.dto.UnitResponse;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.entity.ItemCategory;
import com.company.erp.modules.items.entity.TaxRate;
import com.company.erp.modules.items.entity.Unit;
import com.company.erp.modules.items.repository.ItemCategoryRepository;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.items.repository.TaxRateRepository;
import com.company.erp.modules.items.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final ItemCategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final TaxRateRepository taxRateRepository;

    public ItemServiceImpl(
            ItemRepository itemRepository,
            ItemCategoryRepository categoryRepository,
            UnitRepository unitRepository,
            TaxRateRepository taxRateRepository
    ) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
        this.taxRateRepository = taxRateRepository;
    }

    @Override
    public ItemResponse createItem(ItemRequest request) {
        UUID activeTenantId = TenantContext.getTenantId();

        if (itemRepository.existsBySku(request.sku())) {
            throw new BusinessRuleViolationException("Item with SKU '" + request.sku() + "' already exists");
        }

        Item item = new Item();
        item.setName(request.name());
        item.setSku(request.sku());
        item.setDescription(request.description());
        item.setUnitPrice(request.unitPrice());
        item.setQuantityOnHand(request.quantityOnHand());
        item.setUnitOfMeasure(request.unitOfMeasure());
        if (request.active() != null) {
            item.setActive(request.active());
        }
        item.setOrganizationId(activeTenantId);

        validateAndAssignRelationships(request, item, activeTenantId);

        Item saved = itemRepository.save(item);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponse getItemById(UUID id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
        return mapToResponse(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponse> getAllItems() {
        return itemRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ItemResponse updateItem(UUID id, ItemRequest request) {
        UUID activeTenantId = TenantContext.getTenantId();
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));

        if (!item.getSku().equals(request.sku()) && itemRepository.existsBySku(request.sku())) {
            throw new BusinessRuleViolationException("Item with SKU '" + request.sku() + "' already exists");
        }

        item.setName(request.name());
        item.setSku(request.sku());
        item.setDescription(request.description());
        item.setUnitPrice(request.unitPrice());
        item.setQuantityOnHand(request.quantityOnHand());
        item.setUnitOfMeasure(request.unitOfMeasure());
        if (request.active() != null) {
            item.setActive(request.active());
        }

        validateAndAssignRelationships(request, item, activeTenantId);

        Item updated = itemRepository.save(item);
        return mapToResponse(updated);
    }

    @Override
    public void deleteItem(UUID id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", id));
        itemRepository.delete(item);
    }

    private void validateAndAssignRelationships(ItemRequest request, Item item, UUID activeTenantId) {
        if (request.categoryId() != null) {
            ItemCategory category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new BusinessRuleViolationException("Category with ID '" + request.categoryId() + "' does not exist or does not belong to the active organization"));

            if (activeTenantId != null && category.getOrganizationId() != null && !category.getOrganizationId().equals(activeTenantId)) {
                throw new BusinessRuleViolationException("Category with ID '" + request.categoryId() + "' does not belong to the active organization");
            }
            item.setCategory(category);
        } else {
            item.setCategory(null);
        }

        if (request.unitId() != null) {
            Unit unit = unitRepository.findById(request.unitId())
                    .orElseThrow(() -> new BusinessRuleViolationException("Unit with ID '" + request.unitId() + "' does not exist or does not belong to the active organization"));

            if (activeTenantId != null && unit.getOrganizationId() != null && !unit.getOrganizationId().equals(activeTenantId)) {
                throw new BusinessRuleViolationException("Unit with ID '" + request.unitId() + "' does not belong to the active organization");
            }
            item.setUnit(unit);
        } else {
            item.setUnit(null);
        }

        if (request.taxRateId() != null) {
            TaxRate taxRate = taxRateRepository.findById(request.taxRateId())
                    .orElseThrow(() -> new BusinessRuleViolationException("Tax rate with ID '" + request.taxRateId() + "' does not exist or does not belong to the active organization"));

            if (activeTenantId != null && taxRate.getOrganizationId() != null && !taxRate.getOrganizationId().equals(activeTenantId)) {
                throw new BusinessRuleViolationException("Tax rate with ID '" + request.taxRateId() + "' does not belong to the active organization");
            }
            item.setTaxRate(taxRate);
        } else {
            item.setTaxRate(null);
        }
    }

    private ItemResponse mapToResponse(Item item) {
        ItemCategoryResponse categoryResponse = item.getCategory() != null ? new ItemCategoryResponse(
                item.getCategory().getId(),
                item.getCategory().getOrganizationId(),
                item.getCategory().getName(),
                item.getCategory().getCode(),
                item.getCategory().getDescription(),
                item.getCategory().getCreatedAt(),
                item.getCategory().getUpdatedAt()
        ) : null;

        UnitResponse unitResponse = item.getUnit() != null ? new UnitResponse(
                item.getUnit().getId(),
                item.getUnit().getOrganizationId(),
                item.getUnit().getName(),
                item.getUnit().getCode(),
                item.getUnit().getSymbol(),
                item.getUnit().getCreatedAt(),
                item.getUnit().getUpdatedAt()
        ) : null;

        TaxRateResponse taxRateResponse = item.getTaxRate() != null ? new TaxRateResponse(
                item.getTaxRate().getId(),
                item.getTaxRate().getOrganizationId(),
                item.getTaxRate().getName(),
                item.getTaxRate().getRate(),
                item.getTaxRate().getCode(),
                item.getTaxRate().isActive(),
                item.getTaxRate().getCreatedAt(),
                item.getTaxRate().getUpdatedAt()
        ) : null;

        return new ItemResponse(
                item.getId(),
                item.getOrganizationId(),
                item.getName(),
                item.getSku(),
                item.getDescription(),
                item.getUnitPrice(),
                item.getQuantityOnHand(),
                item.getUnitOfMeasure(),
                item.isActive(),
                categoryResponse,
                unitResponse,
                taxRateResponse,
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
