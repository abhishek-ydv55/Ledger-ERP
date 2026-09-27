package com.company.erp.modules.sales.service;

import com.company.erp.modules.sales.dto.EstimateRequest;
import com.company.erp.modules.sales.dto.EstimateResponse;
import com.company.erp.modules.sales.entity.EstimateStatus;

import java.util.List;
import java.util.UUID;

public interface EstimateService {
    EstimateResponse createEstimate(EstimateRequest request);
    EstimateResponse getEstimateById(UUID id);
    List<EstimateResponse> getAllEstimates();
    EstimateResponse updateEstimate(UUID id, EstimateRequest request);
    EstimateResponse updateStatus(UUID id, EstimateStatus status);
    void deleteEstimate(UUID id);
}
