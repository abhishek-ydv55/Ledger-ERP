package com.company.erp.common.exception;

import java.math.BigDecimal;
import java.util.UUID;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(UUID itemId, BigDecimal requestedQuantity, BigDecimal availableQuantity) {
        super(String.format("Insufficient stock for item %s: requested %s, but only %s available",
                itemId, requestedQuantity, availableQuantity));
    }
}
