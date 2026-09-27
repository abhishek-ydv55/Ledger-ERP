package com.company.erp.modules.items.service;

import com.company.erp.modules.items.dto.ItemCategoryRequest;
import com.company.erp.modules.items.dto.ItemCategoryResponse;

import java.util.List;
import java.util.UUID;

public interface ItemCategoryService {
    ItemCategoryResponse createCategory(ItemCategoryRequest request);
    ItemCategoryResponse getCategoryById(UUID id);
    List<ItemCategoryResponse> getAllCategories();
    ItemCategoryResponse updateCategory(UUID id, ItemCategoryRequest request);
    void deleteCategory(UUID id);
}
