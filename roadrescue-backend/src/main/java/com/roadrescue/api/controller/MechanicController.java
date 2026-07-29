package com.roadrescue.api.controller;

import com.roadrescue.api.dto.LocationUpdateRequest;
import com.roadrescue.api.dto.MechanicRegistrationDto;
import com.roadrescue.api.dto.MechanicResponseDto;
import com.roadrescue.api.service.MechanicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mechanics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MechanicController {

    private final MechanicService mechanicService;

    @PostMapping
    public ResponseEntity<MechanicResponseDto> createMechanic(@Valid @RequestBody MechanicRegistrationDto dto) {
        return new ResponseEntity<>(mechanicService.createMechanic(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MechanicResponseDto> getMechanicById(@PathVariable Long id) {
        return ResponseEntity.ok(mechanicService.getMechanicById(id));
    }

    @GetMapping
    public ResponseEntity<List<MechanicResponseDto>> getAllMechanics() {
        return ResponseEntity.ok(mechanicService.getAllMechanics());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MechanicResponseDto> updateMechanic(@PathVariable Long id, @Valid @RequestBody MechanicRegistrationDto dto) {
        return ResponseEntity.ok(mechanicService.updateMechanic(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMechanic(@PathVariable Long id) {
        mechanicService.deleteMechanic(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<MechanicResponseDto> updateAvailability(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> body) {
        Boolean isAvailable = body.get("isAvailable");
        return ResponseEntity.ok(mechanicService.updateStatus(id, null, isAvailable));
    }

    @PatchMapping("/{id}/location")
    public ResponseEntity<MechanicResponseDto> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(mechanicService.updateLocation(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MechanicResponseDto> updateStatus(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean isOnline,
            @RequestParam(required = false) Boolean isAvailable) {
        return ResponseEntity.ok(mechanicService.updateStatus(id, isOnline, isAvailable));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<MechanicResponseDto>> getNearbyMechanics(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "25.0") Double radius) {
        return ResponseEntity.ok(mechanicService.findNearby(lat, lng, radius));
    }
}