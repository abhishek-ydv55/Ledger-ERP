package com.company.erp.modules.items.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.items.dto.ItemCategoryRequest;
import com.company.erp.modules.items.dto.ItemCategoryResponse;
import com.company.erp.modules.items.service.ItemCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/item-categories")
@Tag(name = "Item Categories", description = "Item Category Management API")
public class ItemCategoryController {

    private final ItemCategoryService categoryService;

    public ItemCategoryController(ItemCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    @Operation(summary = "Create item category")
    public ResponseEntity<ApiResponse<ItemCategoryResponse>> createCategory(@Valid @RequestBody ItemCategoryRequest request) {
        ItemCategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item category created successfully", created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get item category by ID")
    public ResponseEntity<ApiResponse<ItemCategoryResponse>> getCategoryById(@PathVariable UUID id) {
        ItemCategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @GetMapping
    @Operation(summary = "Get all item categories")
    public ResponseEntity<ApiResponse<List<ItemCategoryResponse>>> getAllCategories() {
        List<ItemCategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update item category")
    public ResponseEntity<ApiResponse<ItemCategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody ItemCategoryRequest request
    ) {
        ItemCategoryResponse updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Item category updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete item category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Item category deleted successfully", null));
    }
}
