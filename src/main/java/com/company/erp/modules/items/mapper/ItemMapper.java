package com.company.erp.modules.items.mapper;

import com.company.erp.modules.items.dto.ItemRequest;
import com.company.erp.modules.items.dto.ItemResponse;
import com.company.erp.modules.items.entity.Item;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ItemMapper {

    Item toEntity(ItemRequest request);

    ItemResponse toResponse(Item entity);

    void updateEntityFromRequest(ItemRequest request, @MappingTarget Item entity);
}
