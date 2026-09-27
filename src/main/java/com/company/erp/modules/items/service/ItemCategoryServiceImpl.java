package com.company.erp.modules.items.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.dto.ItemCategoryRequest;
import com.company.erp.modules.items.dto.ItemCategoryResponse;
import com.company.erp.modules.items.entity.ItemCategory;
import com.company.erp.modules.items.repository.ItemCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ItemCategoryServiceImpl implements ItemCategoryService {

    private final ItemCategoryRepository categoryRepository;

    public ItemCategoryServiceImpl(ItemCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public ItemCategoryResponse createCategory(ItemCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new BusinessRuleViolationException("Item category with name '" + request.name() + "' already exists");
        }

        ItemCategory category = new ItemCategory();
        category.setName(request.name());
        category.setCode(request.code());
        category.setDescription(request.description());
        category.setOrganizationId(TenantContext.getTenantId());

        ItemCategory saved = categoryRepository.save(category);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ItemCategoryResponse getCategoryById(UUID id) {
        ItemCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ItemCategory", "id", id));
        return mapToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ItemCategoryResponse updateCategory(UUID id, ItemCategoryRequest request) {
        ItemCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ItemCategory", "id", id));

        if (!category.getName().equals(request.name()) && categoryRepository.existsByName(request.name())) {
            throw new BusinessRuleViolationException("Item category with name '" + request.name() + "' already exists");
        }

        category.setName(request.name());
        category.setCode(request.code());
        category.setDescription(request.description());

        ItemCategory updated = categoryRepository.save(category);
        return mapToResponse(updated);
    }

    @Override
    public void deleteCategory(UUID id) {
        ItemCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ItemCategory", "id", id));
        categoryRepository.delete(category);
    }

    private ItemCategoryResponse mapToResponse(ItemCategory category) {
        return new ItemCategoryResponse(
                category.getId(),
                category.getOrganizationId(),
                category.getName(),
                category.getCode(),
                category.getDescription(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
