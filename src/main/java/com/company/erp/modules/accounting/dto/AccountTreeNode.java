package com.company.erp.modules.accounting.dto;

import com.company.erp.modules.accounting.entity.AccountType;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public record AccountTreeNode(
        UUID id,
        String code,
        String name,
        AccountType accountType,
        boolean header,
        boolean active,
        UUID parentId,
        List<AccountTreeNode> children
) {
    public AccountTreeNode {
        if (children == null) {
            children = new ArrayList<>();
        }
    }
}
