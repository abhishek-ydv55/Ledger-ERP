package com.company.erp.modules.items.mapper;

import com.company.erp.modules.items.dto.ItemCategoryResponse;
import com.company.erp.modules.items.dto.ItemRequest;
import com.company.erp.modules.items.dto.ItemResponse;
import com.company.erp.modules.items.dto.TaxRateResponse;
import com.company.erp.modules.items.dto.UnitResponse;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.entity.ItemCategory;
import com.company.erp.modules.items.entity.TaxRate;
import com.company.erp.modules.items.entity.Unit;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-28T00:24:06+0530",
    comments = "version: 1.6.2, compiler: Eclipse JDT (IDE) 3.46.100.v20260826-1225, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class ItemMapperImpl implements ItemMapper {

    @Override
    public Item toEntity(ItemRequest request) {
        if ( request == null ) {
            return null;
        }

        Item item = new Item();

        item.setName( request.name() );
        item.setSku( request.sku() );
        item.setDescription( request.description() );
        item.setUnitPrice( request.unitPrice() );
        item.setQuantityOnHand( request.quantityOnHand() );
        item.setUnitOfMeasure( request.unitOfMeasure() );
        if ( request.active() != null ) {
            item.setActive( request.active() );
        }

        return item;
    }

    @Override
    public ItemResponse toResponse(Item entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID organizationId = null;
        String name = null;
        String sku = null;
        String description = null;
        BigDecimal unitPrice = null;
        BigDecimal quantityOnHand = null;
        String unitOfMeasure = null;
        boolean active = false;
        ItemCategoryResponse category = null;
        UnitResponse unit = null;
        TaxRateResponse taxRate = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = entity.getId();
        organizationId = entity.getOrganizationId();
        name = entity.getName();
        sku = entity.getSku();
        description = entity.getDescription();
        unitPrice = entity.getUnitPrice();
        quantityOnHand = entity.getQuantityOnHand();
        unitOfMeasure = entity.getUnitOfMeasure();
        active = entity.isActive();
        category = itemCategoryToItemCategoryResponse( entity.getCategory() );
        unit = unitToUnitResponse( entity.getUnit() );
        taxRate = taxRateToTaxRateResponse( entity.getTaxRate() );
        createdAt = entity.getCreatedAt();
        updatedAt = entity.getUpdatedAt();

        ItemResponse itemResponse = new ItemResponse( id, organizationId, name, sku, description, unitPrice, quantityOnHand, unitOfMeasure, active, category, unit, taxRate, createdAt, updatedAt );

        return itemResponse;
    }

    @Override
    public void updateEntityFromRequest(ItemRequest request, Item entity) {
        if ( request == null ) {
            return;
        }

        entity.setName( request.name() );
        entity.setSku( request.sku() );
        entity.setDescription( request.description() );
        entity.setUnitPrice( request.unitPrice() );
        entity.setQuantityOnHand( request.quantityOnHand() );
        entity.setUnitOfMeasure( request.unitOfMeasure() );
        if ( request.active() != null ) {
            entity.setActive( request.active() );
        }
    }

    protected ItemCategoryResponse itemCategoryToItemCategoryResponse(ItemCategory itemCategory) {
        if ( itemCategory == null ) {
            return null;
        }

        UUID id = null;
        UUID organizationId = null;
        String name = null;
        String code = null;
        String description = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = itemCategory.getId();
        organizationId = itemCategory.getOrganizationId();
        name = itemCategory.getName();
        code = itemCategory.getCode();
        description = itemCategory.getDescription();
        createdAt = itemCategory.getCreatedAt();
        updatedAt = itemCategory.getUpdatedAt();

        ItemCategoryResponse itemCategoryResponse = new ItemCategoryResponse( id, organizationId, name, code, description, createdAt, updatedAt );

        return itemCategoryResponse;
    }

    protected UnitResponse unitToUnitResponse(Unit unit) {
        if ( unit == null ) {
            return null;
        }

        UUID id = null;
        UUID organizationId = null;
        String name = null;
        String code = null;
        String symbol = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = unit.getId();
        organizationId = unit.getOrganizationId();
        name = unit.getName();
        code = unit.getCode();
        symbol = unit.getSymbol();
        createdAt = unit.getCreatedAt();
        updatedAt = unit.getUpdatedAt();

        UnitResponse unitResponse = new UnitResponse( id, organizationId, name, code, symbol, createdAt, updatedAt );

        return unitResponse;
    }

    protected TaxRateResponse taxRateToTaxRateResponse(TaxRate taxRate) {
        if ( taxRate == null ) {
            return null;
        }

        UUID id = null;
        UUID organizationId = null;
        String name = null;
        BigDecimal rate = null;
        String code = null;
        boolean active = false;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = taxRate.getId();
        organizationId = taxRate.getOrganizationId();
        name = taxRate.getName();
        rate = taxRate.getRate();
        code = taxRate.getCode();
        active = taxRate.isActive();
        createdAt = taxRate.getCreatedAt();
        updatedAt = taxRate.getUpdatedAt();

        TaxRateResponse taxRateResponse = new TaxRateResponse( id, organizationId, name, rate, code, active, createdAt, updatedAt );

        return taxRateResponse;
    }
}
