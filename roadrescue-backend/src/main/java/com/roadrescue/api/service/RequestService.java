package com.roadrescue.api.service;

import com.roadrescue.api.dto.ServiceRequestCreateDto;
import com.roadrescue.api.dto.ServiceRequestResponseDto;
import java.util.List;

public interface RequestService {
    ServiceRequestResponseDto createRequest(ServiceRequestCreateDto dto);
    ServiceRequestResponseDto getRequestById(Long id);
    ServiceRequestResponseDto getActiveRequestForUser(Long userId, String role);
    ServiceRequestResponseDto acceptRequest(Long id, Long userId); // userId of mechanic
    ServiceRequestResponseDto updateRequestStatus(Long id, String status);
    ServiceRequestResponseDto cancelRequest(Long id);
    List<ServiceRequestResponseDto> getHistoryForUser(Long userId, String role);
    List<ServiceRequestResponseDto> getNearbyPendingRequests(Double lat, Double lng, Double radius);
    List<ServiceRequestResponseDto> getAllRequests();
}
