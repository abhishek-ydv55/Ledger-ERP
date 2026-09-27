package com.company.erp.modules.parties.entity;

import com.company.erp.common.domain.TenantScopedEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "parties")
public class Party extends TenantScopedEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code")
    private String code;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "party_roles", joinColumns = @JoinColumn(name = "party_id"))
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    private Set<PartyRole> roles = new HashSet<>();

    @OneToMany(mappedBy = "party", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PartyContact> contacts = new HashSet<>();

    @OneToMany(mappedBy = "party", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<PartyAddress> addresses = new HashSet<>();

    public Party() {
    }

    public Party(String name, String code, String email, String phone, String taxId, boolean active) {
        this.name = name;
        this.code = code;
        this.email = email;
        this.phone = phone;
        this.taxId = taxId;
        this.active = active;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<PartyRole> getRoles() {
        return roles;
    }

    public void setRoles(Set<PartyRole> roles) {
        this.roles = roles;
    }

    public Set<PartyContact> getContacts() {
        return contacts;
    }

    public void setContacts(Set<PartyContact> contacts) {
        this.contacts = contacts;
    }

    public Set<PartyAddress> getAddresses() {
        return addresses;
    }

    public void setAddresses(Set<PartyAddress> addresses) {
        this.addresses = addresses;
    }

    public void addContact(PartyContact contact) {
        contacts.add(contact);
        contact.setParty(this);
    }

    public void removeContact(PartyContact contact) {
        contacts.remove(contact);
        contact.setParty(null);
    }

    public void addAddress(PartyAddress address) {
        addresses.add(address);
        address.setParty(this);
    }

    public void removeAddress(PartyAddress address) {
        addresses.remove(address);
        address.setParty(null);
    }
}
