package com.nutricart.service;

import com.nutricart.domain.Address;
import com.nutricart.domain.UserAccount;
import com.nutricart.dto.Dtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.AddressRepository;
import com.nutricart.repository.UserAccountRepository;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Delivery addresses. An order stores its own snapshot, so editing an address
 * later never rewrites a historic invoice.
 */
@Service
public class AddressService {

    private static final Pattern PINCODE = Pattern.compile("^[1-9][0-9]{5}$");
    private static final Pattern PHONE = Pattern.compile("^[6-9][0-9]{9}$");

    private final AddressRepository addresses;
    private final UserAccountRepository users;
    private final DtoMapper mapper;

    public AddressService(AddressRepository addresses, UserAccountRepository users, DtoMapper mapper) {
        this.addresses = addresses;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<Dtos.AddressDto> list(Long userId) {
        return addresses.findByUserIdOrderByIsDefaultDescIdAsc(userId).stream().map(mapper::address).toList();
    }

    @Transactional
    public Dtos.AddressDto create(Long userId, Dtos.AddressRequest request) {
        UserAccount account = requireUser(userId);
        List<Address> existing = addresses.findByUserIdOrderByIsDefaultDescIdAsc(userId);

        Address address = new Address();
        address.setUser(account);
        applyRequest(address, request);
        // The first address on an account becomes the default one automatically.
        boolean makeDefault = existing.isEmpty() || Boolean.TRUE.equals(request.isDefault());
        address.setDefault(makeDefault);
        Address saved = addresses.save(address);

        if (makeDefault) {
            clearOtherDefaults(userId, saved.getId());
        }
        return mapper.address(saved);
    }

    @Transactional
    public Dtos.AddressDto update(Long userId, Long id, Dtos.AddressRequest request) {
        Address address = require(userId, id);
        applyRequest(address, request);
        if (Boolean.TRUE.equals(request.isDefault())) {
            address.setDefault(true);
        }
        Address saved = addresses.save(address);
        if (saved.isDefault()) {
            clearOtherDefaults(userId, saved.getId());
        }
        return mapper.address(saved);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Address address = require(userId, id);
        boolean wasDefault = address.isDefault();
        addresses.delete(address);
        addresses.flush();
        if (wasDefault) {
            List<Address> remaining = addresses.findByUserIdOrderByIsDefaultDescIdAsc(userId);
            if (!remaining.isEmpty()) {
                remaining.get(0).setDefault(true);
                addresses.save(remaining.get(0));
            }
        }
    }

    @Transactional
    public List<Dtos.AddressDto> setDefault(Long userId, Long id) {
        Address address = require(userId, id);
        clearOtherDefaults(userId, address.getId());
        address.setDefault(true);
        addresses.save(address);
        return list(userId);
    }

    @Transactional(readOnly = true)
    public Address require(Long userId, Long id) {
        return addresses.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("That address no longer exists."));
    }

    private void applyRequest(Address address, Dtos.AddressRequest request) {
        String recipient = trimmed(request.recipientName());
        String phone = trimmed(request.phone());
        String line1 = trimmed(request.line1());
        String city = trimmed(request.city());
        String state = trimmed(request.state());
        String pincode = trimmed(request.pincode());

        if (recipient.isEmpty()) {
            throw ApiException.field("recipientName", "Enter the recipient name.");
        }
        if (!PHONE.matcher(phone).matches()) {
            throw ApiException.field("phone", "Enter a valid 10 digit mobile number.");
        }
        if (line1.isEmpty()) {
            throw ApiException.field("line1", "Enter the street address.");
        }
        if (city.isEmpty()) {
            throw ApiException.field("city", "Enter the city.");
        }
        if (state.isEmpty()) {
            throw ApiException.field("state", "Enter the state.");
        }
        if (!PINCODE.matcher(pincode).matches()) {
            throw ApiException.field("pincode", "Enter a valid 6 digit pincode.");
        }

        address.setLabel(trimmed(request.label()).isEmpty() ? "Home" : trimmed(request.label()));
        address.setRecipientName(recipient);
        address.setPhone(phone);
        address.setLine1(line1);
        address.setLine2(request.line2() == null ? "" : request.line2().trim());
        address.setCity(city);
        address.setState(state);
        address.setPincode(pincode);
    }

    private void clearOtherDefaults(Long userId, Long keepId) {
        List<Address> others = addresses.findByUserIdAndIsDefaultTrue(userId).stream()
                .filter(address -> !address.getId().equals(keepId))
                .toList();
        others.forEach(address -> address.setDefault(false));
        addresses.saveAll(others);
    }

    private String trimmed(String value) {
        return value == null ? "" : value.trim();
    }

    private UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}