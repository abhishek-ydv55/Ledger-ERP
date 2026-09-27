package com.company.erp.modules.items.service;

import com.company.erp.modules.items.dto.ItemRequest;
import com.company.erp.modules.items.dto.ItemResponse;

import java.util.List;
import java.util.UUID;

public interface ItemService {

    ItemResponse createItem(ItemRequest request);

    ItemResponse getItemById(UUID id);

    List<ItemResponse> getAllItems();

    ItemResponse updateItem(UUID id, ItemRequest request);

    void deleteItem(UUID id);
}
