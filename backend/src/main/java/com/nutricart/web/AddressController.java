package com.nutricart.web;

import com.nutricart.dto.Dtos;
import com.nutricart.security.CurrentUser;
import com.nutricart.service.AddressService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Delivery addresses used at checkout and printed on the invoice. */
@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<Dtos.AddressDto> list() {
        return addressService.list(CurrentUser.id());
    }

    @PostMapping
    public ResponseEntity<Dtos.AddressDto> create(@RequestBody Dtos.AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.create(CurrentUser.id(), request));
    }

    @PutMapping("/{id}")
    public Dtos.AddressDto update(@PathVariable Long id, @RequestBody Dtos.AddressRequest request) {
        return addressService.update(CurrentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        addressService.delete(CurrentUser.id(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/default")
    public List<Dtos.AddressDto> setDefault(@PathVariable Long id) {
        return addressService.setDefault(CurrentUser.id(), id);
    }
}