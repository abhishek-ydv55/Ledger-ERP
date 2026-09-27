package com.company.erp.modules.parties.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.parties.dto.PartyAddressRequest;
import com.company.erp.modules.parties.dto.PartyAddressResponse;
import com.company.erp.modules.parties.dto.PartyContactRequest;
import com.company.erp.modules.parties.dto.PartyContactResponse;
import com.company.erp.modules.parties.dto.PartyRequest;
import com.company.erp.modules.parties.dto.PartyResponse;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.entity.PartyAddress;
import com.company.erp.modules.parties.entity.PartyContact;
import com.company.erp.modules.parties.entity.PartyRole;
import com.company.erp.modules.parties.repository.PartyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class PartyServiceImpl implements PartyService {

    private final PartyRepository partyRepository;

    public PartyServiceImpl(PartyRepository partyRepository) {
        this.partyRepository = partyRepository;
    }

    @Override
    public PartyResponse createParty(PartyRequest request, PartyRole defaultRole) {
        if (request.code() != null && !request.code().isBlank() && partyRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Party with code '" + request.code() + "' already exists");
        }

        Party party = new Party();
        party.setName(request.name());
        party.setCode(request.code());
        party.setEmail(request.email());
        party.setPhone(request.phone());
        party.setTaxId(request.taxId());
        if (request.active() != null) {
            party.setActive(request.active());
        }
        party.setOrganizationId(TenantContext.getTenantId());

        Set<PartyRole> roles = new HashSet<>();
        if (request.roles() != null && !request.roles().isEmpty()) {
            roles.addAll(request.roles());
        } else if (defaultRole != null) {
            roles.add(defaultRole);
        }
        party.setRoles(roles);

        if (request.contacts() != null) {
            for (PartyContactRequest cReq : request.contacts()) {
                PartyContact contact = new PartyContact(
                        cReq.name(),
                        cReq.email(),
                        cReq.phone(),
                        cReq.designation(),
                        Boolean.TRUE.equals(cReq.isPrimary())
                );
                party.addContact(contact);
            }
        }

        if (request.addresses() != null) {
            for (PartyAddressRequest aReq : request.addresses()) {
                PartyAddress address = new PartyAddress(
                        aReq.addressType(),
                        aReq.addressLine1(),
                        aReq.addressLine2(),
                        aReq.city(),
                        aReq.state(),
                        aReq.postalCode(),
                        aReq.country(),
                        Boolean.TRUE.equals(aReq.isPrimary())
                );
                party.addAddress(address);
            }
        }

        Party saved = partyRepository.save(party);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PartyResponse getPartyById(UUID id, PartyRole roleFilter) {
        Party party = partyRepository.findByIdAndRole(id, roleFilter)
                .orElseThrow(() -> new ResourceNotFoundException("Party", "id", id));
        return mapToResponse(party);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PartyResponse> getAllParties(PartyRole roleFilter) {
        return partyRepository.findByRole(roleFilter).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public PartyResponse updateParty(UUID id, PartyRequest request, PartyRole roleFilter) {
        Party party = partyRepository.findByIdAndRole(id, roleFilter)
                .orElseThrow(() -> new ResourceNotFoundException("Party", "id", id));

        if (request.code() != null && !request.code().isBlank() && !request.code().equals(party.getCode())
                && partyRepository.existsByCode(request.code())) {
            throw new BusinessRuleViolationException("Party with code '" + request.code() + "' already exists");
        }

        party.setName(request.name());
        party.setCode(request.code());
        party.setEmail(request.email());
        party.setPhone(request.phone());
        party.setTaxId(request.taxId());
        if (request.active() != null) {
            party.setActive(request.active());
        }

        if (request.roles() != null && !request.roles().isEmpty()) {
            party.getRoles().clear();
            party.getRoles().addAll(request.roles());
        }

        if (request.contacts() != null) {
            party.getContacts().clear();
            for (PartyContactRequest cReq : request.contacts()) {
                PartyContact contact = new PartyContact(
                        cReq.name(),
                        cReq.email(),
                        cReq.phone(),
                        cReq.designation(),
                        Boolean.TRUE.equals(cReq.isPrimary())
                );
                party.addContact(contact);
            }
        }

        if (request.addresses() != null) {
            party.getAddresses().clear();
            for (PartyAddressRequest aReq : request.addresses()) {
                PartyAddress address = new PartyAddress(
                        aReq.addressType(),
                        aReq.addressLine1(),
                        aReq.addressLine2(),
                        aReq.city(),
                        aReq.state(),
                        aReq.postalCode(),
                        aReq.country(),
                        Boolean.TRUE.equals(aReq.isPrimary())
                );
                party.addAddress(address);
            }
        }

        Party updated = partyRepository.save(party);
        return mapToResponse(updated);
    }

    @Override
    public void deleteParty(UUID id, PartyRole roleFilter) {
        Party party = partyRepository.findByIdAndRole(id, roleFilter)
                .orElseThrow(() -> new ResourceNotFoundException("Party", "id", id));
        partyRepository.delete(party);
    }

    private PartyResponse mapToResponse(Party party) {
        List<PartyContactResponse> contacts = party.getContacts() != null ? party.getContacts().stream()
                .map(c -> new PartyContactResponse(
                        c.getId(),
                        c.getName(),
                        c.getEmail(),
                        c.getPhone(),
                        c.getDesignation(),
                        c.isPrimary(),
                        c.getCreatedAt(),
                        c.getUpdatedAt()
                )).toList() : List.of();

        List<PartyAddressResponse> addresses = party.getAddresses() != null ? party.getAddresses().stream()
                .map(a -> new PartyAddressResponse(
                        a.getId(),
                        a.getAddressType(),
                        a.getAddressLine1(),
                        a.getAddressLine2(),
                        a.getCity(),
                        a.getState(),
                        a.getPostalCode(),
                        a.getCountry(),
                        a.isPrimary(),
                        a.getCreatedAt(),
                        a.getUpdatedAt()
                )).toList() : List.of();

        return new PartyResponse(
                party.getId(),
                party.getOrganizationId(),
                party.getName(),
                party.getCode(),
                party.getEmail(),
                party.getPhone(),
                party.getTaxId(),
                party.isActive(),
                party.getRoles(),
                contacts,
                addresses,
                party.getCreatedAt(),
                party.getUpdatedAt()
        );
    }
}
