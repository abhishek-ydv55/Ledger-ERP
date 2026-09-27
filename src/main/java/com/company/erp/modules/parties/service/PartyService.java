package com.company.erp.modules.parties.service;

import com.company.erp.modules.parties.dto.PartyRequest;
import com.company.erp.modules.parties.dto.PartyResponse;
import com.company.erp.modules.parties.entity.PartyRole;

import java.util.List;
import java.util.UUID;

public interface PartyService {
    PartyResponse createParty(PartyRequest request, PartyRole defaultRole);
    PartyResponse getPartyById(UUID id, PartyRole roleFilter);
    List<PartyResponse> getAllParties(PartyRole roleFilter);
    PartyResponse updateParty(UUID id, PartyRequest request, PartyRole roleFilter);
    void deleteParty(UUID id, PartyRole roleFilter);
}
