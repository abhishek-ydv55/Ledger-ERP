package com.company.erp.common.controller;

import com.company.erp.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<ApiResponse<Map<String, Object>>> home() {
        Map<String, Object> info = Map.of(
                "status", "UP",
                "application", "Multi-Tenant ERP Backend API",
                "h2Console", "/h2-console",
                "swaggerUI", "/swagger-ui.html"
        );
        return ResponseEntity.ok(ApiResponse.success("ERP Backend API Running", info));
    }
}
