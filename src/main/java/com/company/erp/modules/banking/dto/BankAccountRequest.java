package com.company.erp.modules.banking.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record BankAccountRequest(
        @NotBlank(message = "Account name is required") String accountName,
        @NotBlank(message = "Account number is required") String accountNumber,
        String bankName,
        String currency,
        BigDecimal openingBalance,
        Boolean active
) {
}
