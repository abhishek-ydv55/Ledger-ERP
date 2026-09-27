package com.company.erp.common.exception;

import com.company.erp.common.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should map ResourceNotFoundException to 404 NOT_FOUND")
    void handleResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        ResourceNotFoundException ex = new ResourceNotFoundException("Customer", "id", id);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleResourceNotFoundException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Customer not found with id");
    }

    @Test
    @DisplayName("Should map BusinessRuleViolationException to 400 BAD_REQUEST")
    void handleBusinessRuleViolationException() {
        BusinessRuleViolationException ex = new BusinessRuleViolationException("Cannot post closed fiscal year journal entry");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBusinessRuleViolationException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Cannot post closed fiscal year journal entry");
    }

    @Test
    @DisplayName("Should map InsufficientStockException to 400 BAD_REQUEST")
    void handleInsufficientStockException() {
        UUID itemId = UUID.randomUUID();
        InsufficientStockException ex = new InsufficientStockException(itemId, new BigDecimal("100"), new BigDecimal("10"));

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleInsufficientStockException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).contains("Insufficient stock for item");
    }
}
