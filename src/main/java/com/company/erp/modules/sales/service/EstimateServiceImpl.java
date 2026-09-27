package com.company.erp.modules.sales.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.sales.dto.EstimateRequest;
import com.company.erp.modules.sales.dto.EstimateResponse;
import com.company.erp.modules.sales.dto.SalesItemRequest;
import com.company.erp.modules.sales.dto.SalesItemResponse;
import com.company.erp.modules.sales.entity.Estimate;
import com.company.erp.modules.sales.entity.EstimateItem;
import com.company.erp.modules.sales.entity.EstimateStatus;
import com.company.erp.modules.sales.repository.EstimateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class EstimateServiceImpl implements EstimateService {

    private static final Map<EstimateStatus, Set<EstimateStatus>> ALLOWED_TRANSITIONS = Map.of(
            EstimateStatus.DRAFT, Set.of(EstimateStatus.SENT, EstimateStatus.CANCELLED),
            EstimateStatus.SENT, Set.of(EstimateStatus.ACCEPTED, EstimateStatus.REJECTED, EstimateStatus.EXPIRED, EstimateStatus.CANCELLED),
            EstimateStatus.ACCEPTED, Set.of(EstimateStatus.CANCELLED),
            EstimateStatus.REJECTED, Set.of(),
            EstimateStatus.EXPIRED, Set.of(),
            EstimateStatus.CANCELLED, Set.of()
    );

    private final EstimateRepository estimateRepository;
    private final PartyRepository partyRepository;
    private final ItemRepository itemRepository;

    public EstimateServiceImpl(EstimateRepository estimateRepository, PartyRepository partyRepository, ItemRepository itemRepository) {
        this.estimateRepository = estimateRepository;
        this.partyRepository = partyRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public EstimateResponse createEstimate(EstimateRequest request) {
        if (estimateRepository.existsByEstimateNumber(request.estimateNumber())) {
            throw new BusinessRuleViolationException("Estimate with number '" + request.estimateNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        Estimate estimate = new Estimate(
                customer,
                request.estimateNumber(),
                request.estimateDate(),
                request.expirationDate(),
                EstimateStatus.DRAFT,
                request.notes()
        );
        estimate.setOrganizationId(TenantContext.getTenantId());

        populateItems(estimate, request.items());
        Estimate saved = estimateRepository.save(estimate);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public EstimateResponse getEstimateById(UUID id) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate not found with id: " + id));
        return mapToResponse(estimate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EstimateResponse> getAllEstimates() {
        return estimateRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public EstimateResponse updateEstimate(UUID id, EstimateRequest request) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate not found with id: " + id));

        if (estimate.getStatus() != EstimateStatus.DRAFT) {
            throw new BusinessRuleViolationException("Cannot edit estimate in status: " + estimate.getStatus());
        }

        if (!estimate.getEstimateNumber().equals(request.estimateNumber()) && estimateRepository.existsByEstimateNumber(request.estimateNumber())) {
            throw new BusinessRuleViolationException("Estimate with number '" + request.estimateNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        estimate.setCustomer(customer);
        estimate.setEstimateNumber(request.estimateNumber());
        estimate.setEstimateDate(request.estimateDate());
        estimate.setExpirationDate(request.expirationDate());
        estimate.setNotes(request.notes());

        estimate.getItems().clear();
        populateItems(estimate, request.items());

        Estimate updated = estimateRepository.save(estimate);
        return mapToResponse(updated);
    }

    @Override
    public EstimateResponse updateStatus(UUID id, EstimateStatus newStatus) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate not found with id: " + id));

        Set<EstimateStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(estimate.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new BusinessRuleViolationException("Invalid status transition from " + estimate.getStatus() + " to " + newStatus);
        }

        estimate.setStatus(newStatus);
        Estimate updated = estimateRepository.save(estimate);
        return mapToResponse(updated);
    }

    @Override
    public void deleteEstimate(UUID id) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estimate not found with id: " + id));
        estimateRepository.delete(estimate);
    }

    private void populateItems(Estimate estimate, List<SalesItemRequest> itemRequests) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (SalesItemRequest itemReq : itemRequests) {
            Item item = itemRepository.findById(itemReq.itemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemReq.itemId()));

            BigDecimal qty = itemReq.quantity();
            BigDecimal price = itemReq.unitPrice();
            BigDecimal lineSubtotal = qty.multiply(price);

            BigDecimal taxRate = itemReq.taxRate() != null ? itemReq.taxRate() : BigDecimal.ZERO;
            BigDecimal taxAmount = lineSubtotal.multiply(taxRate).divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(taxAmount);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(taxAmount);

            EstimateItem estimateItem = new EstimateItem(
                    item,
                    itemReq.description() != null ? itemReq.description() : item.getName(),
                    qty,
                    price,
                    taxRate,
                    taxAmount,
                    lineTotal
            );
            estimate.addItem(estimateItem);
        }

        estimate.setSubtotal(subtotal);
        estimate.setTaxAmount(totalTax);
        estimate.setTotalAmount(subtotal.add(totalTax));
    }

    private EstimateResponse mapToResponse(Estimate estimate) {
        List<SalesItemResponse> itemResponses = estimate.getItems().stream()
                .map(item -> new SalesItemResponse(
                        item.getId(),
                        item.getItem().getId(),
                        item.getItem().getName(),
                        item.getItem().getSku(),
                        item.getDescription(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTaxRate(),
                        item.getTaxAmount(),
                        item.getTotalAmount()
                ))
                .collect(Collectors.toList());

        return new EstimateResponse(
                estimate.getId(),
                estimate.getOrganizationId(),
                estimate.getCustomer() != null ? estimate.getCustomer().getId() : null,
                estimate.getCustomer() != null ? estimate.getCustomer().getName() : null,
                estimate.getEstimateNumber(),
                estimate.getEstimateDate(),
                estimate.getExpirationDate(),
                estimate.getStatus(),
                estimate.getSubtotal(),
                estimate.getTaxAmount(),
                estimate.getTotalAmount(),
                estimate.getNotes(),
                itemResponses,
                estimate.getCreatedAt(),
                estimate.getUpdatedAt()
        );
    }
}
