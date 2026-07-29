package com.roadrescue.api.service;

import com.roadrescue.api.dto.LocationUpdateRequest;
import com.roadrescue.api.dto.MechanicRegistrationDto;
import com.roadrescue.api.dto.MechanicResponseDto;
import java.util.List;

public interface MechanicService {
    MechanicResponseDto createMechanic(MechanicRegistrationDto dto);
    MechanicResponseDto getMechanicById(Long id);
    List<MechanicResponseDto> getAllMechanics();
    MechanicResponseDto updateMechanic(Long id, MechanicRegistrationDto dto);
    void deleteMechanic(Long id);
    MechanicResponseDto updateLocation(Long id, LocationUpdateRequest request);
    MechanicResponseDto updateStatus(Long id, Boolean isOnline, Boolean isAvailable);
    List<MechanicResponseDto> findNearby(Double lat, Double lng, Double radius);
}
