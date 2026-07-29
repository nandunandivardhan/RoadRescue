package com.roadrescue.api.service.impl;

import com.roadrescue.api.dto.ServiceRequestCreateDto;
import com.roadrescue.api.dto.ServiceRequestResponseDto;
import com.roadrescue.api.entity.Mechanic;
import com.roadrescue.api.entity.ServiceRequest;
import com.roadrescue.api.entity.ServiceRequest.RequestStatus;
import com.roadrescue.api.entity.User;
import com.roadrescue.api.exception.ResourceNotFoundException;
import com.roadrescue.api.repository.MechanicRepository;
import com.roadrescue.api.repository.ServiceRequestRepository;
import com.roadrescue.api.repository.UserRepository;
import com.roadrescue.api.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestServiceImpl implements RequestService {

    private final ServiceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final MechanicRepository mechanicRepository;

    @Override
    @Transactional
    public ServiceRequestResponseDto createRequest(ServiceRequestCreateDto dto) {
        User customer = userRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", dto.getCustomerId()));

        // Check if there is already an active request for this customer
        List<ServiceRequest> activeRequests = requestRepository.findActiveRequestByCustomerId(
                customer.getId(), RequestStatus.COMPLETED, RequestStatus.CANCELLED);
        if (!activeRequests.isEmpty()) {
            return mapToResponseDto(activeRequests.get(0));
        }

        // Calculate a mock estimated cost if not provided
        Double estimatedCost = dto.getEstimatedCost();
        if (estimatedCost == null || estimatedCost == 0) {
            estimatedCost = 500.0 + (Math.random() * 1500.0);
            estimatedCost = Math.round(estimatedCost * 100.0) / 100.0;
        }

        ServiceRequest request = ServiceRequest.builder()
                .customer(customer)
                .issueType(dto.getIssueType())
                .description(dto.getDescription())
                .status(RequestStatus.PENDING)
                .pickupLatitude(dto.getPickupLatitude())
                .pickupLongitude(dto.getPickupLongitude())
                .pickupAddress(dto.getPickupAddress())
                .estimatedCost(estimatedCost)
                .build();

        request = requestRepository.save(request);
        return mapToResponseDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceRequestResponseDto getRequestById(Long id) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceRequest", "id", id));
        return mapToResponseDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceRequestResponseDto getActiveRequestForUser(Long userId, String role) {
        List<ServiceRequest> activeList;
        if ("mechanic".equalsIgnoreCase(role)) {
            // Find mechanic entity associated with this userId
            Mechanic mechanic = mechanicRepository.findAll().stream()
                    .filter(m -> m.getUser().getId().equals(userId))
                    .findFirst()
                    .orElse(null);
            
            if (mechanic == null) return null;
            
            activeList = requestRepository.findActiveRequestByMechanicId(
                    mechanic.getId(), RequestStatus.COMPLETED, RequestStatus.CANCELLED);
        } else {
            activeList = requestRepository.findActiveRequestByCustomerId(
                    userId, RequestStatus.COMPLETED, RequestStatus.CANCELLED);
        }

        if (activeList.isEmpty()) {
            return null;
        }
        return mapToResponseDto(activeList.get(0));
    }

    @Override
    @Transactional
    public ServiceRequestResponseDto acceptRequest(Long id, Long userId) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceRequest", "id", id));

        // Find mechanic associated with this userId
        Mechanic mechanic = mechanicRepository.findAll().stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic", "userId", userId));

        request.setMechanic(mechanic);
        request.setStatus(RequestStatus.ACCEPTED);
        
        // Mark mechanic unavailable
        mechanic.setIsAvailable(false);
        mechanicRepository.save(mechanic);

        request = requestRepository.save(request);
        return mapToResponseDto(request);
    }

    @Override
    @Transactional
    public ServiceRequestResponseDto updateRequestStatus(Long id, String statusStr) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceRequest", "id", id));

        RequestStatus newStatus;
        try {
            newStatus = RequestStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status value: " + statusStr);
        }

        request.setStatus(newStatus);

        if (newStatus == RequestStatus.COMPLETED) {
            request.setCompletedAt(LocalDateTime.now());
            if (request.getActualCost() == null) {
                request.setActualCost(request.getEstimatedCost());
            }
            // Release mechanic
            if (request.getMechanic() != null) {
                Mechanic mechanic = request.getMechanic();
                mechanic.setIsAvailable(true);
                mechanicRepository.save(mechanic);
            }
        } else if (newStatus == RequestStatus.CANCELLED) {
            // Release mechanic
            if (request.getMechanic() != null) {
                Mechanic mechanic = request.getMechanic();
                mechanic.setIsAvailable(true);
                mechanicRepository.save(mechanic);
            }
        }

        request = requestRepository.save(request);
        return mapToResponseDto(request);
    }

    @Override
    @Transactional
    public ServiceRequestResponseDto cancelRequest(Long id) {
        return updateRequestStatus(id, "CANCELLED");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponseDto> getHistoryForUser(Long userId, String role) {
        List<ServiceRequest> list;
        if ("mechanic".equalsIgnoreCase(role)) {
            Mechanic mechanic = mechanicRepository.findAll().stream()
                    .filter(m -> m.getUser().getId().equals(userId))
                    .findFirst()
                    .orElse(null);
            
            if (mechanic == null) return List.of();
            list = requestRepository.findByMechanicIdOrderByCreatedAtDesc(mechanic.getId());
        } else {
            list = requestRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
        }

        return list.stream()
                .filter(r -> r.getStatus() == RequestStatus.COMPLETED || r.getStatus() == RequestStatus.CANCELLED)
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponseDto> getNearbyPendingRequests(Double lat, Double lng, Double radius) {
        // Retrieve all pending requests
        List<ServiceRequest> pendingRequests = requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING);
        
        // Filter by coordinates if provided (radius default to 25km)
        if (lat != null && lng != null) {
            final double rad = radius != null ? radius : 25.0;
            return pendingRequests.stream()
                    .filter(r -> {
                        double d = calculateHaversineDistance(lat, lng, r.getPickupLatitude(), r.getPickupLongitude());
                        return d <= rad;
                    })
                    .map(this::mapToResponseDto)
                    .collect(Collectors.toList());
        }

        return pendingRequests.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceRequestResponseDto> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c; // Radius of Earth in kilometers
    }

    private ServiceRequestResponseDto mapToResponseDto(ServiceRequest r) {
        if (r == null) return null;

        Long mechId = null;
        String mechName = null;
        String mechPhone = null;
        Double mechLat = null;
        Double mechLng = null;

        if (r.getMechanic() != null) {
            Mechanic m = r.getMechanic();
            mechId = m.getId();
            mechLat = m.getLatitude();
            mechLng = m.getLongitude();
            if (m.getUser() != null) {
                mechName = m.getUser().getName();
                mechPhone = m.getUser().getPhone();
            }
        }

        return ServiceRequestResponseDto.builder()
                .id(r.getId())
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .customerName(r.getCustomer() != null ? r.getCustomer().getName() : "Unknown")
                .customerPhone(r.getCustomer() != null ? r.getCustomer().getPhone() : "")
                .mechanicId(mechId)
                .mechanicName(mechName)
                .mechanicPhone(mechPhone)
                .mechanicLatitude(mechLat)
                .mechanicLongitude(mechLng)
                .issueType(r.getIssueType())
                .description(r.getDescription())
                .status(r.getStatus().name())
                .pickupLatitude(r.getPickupLatitude())
                .pickupLongitude(r.getPickupLongitude())
                .pickupAddress(r.getPickupAddress())
                .estimatedCost(r.getEstimatedCost())
                .actualCost(r.getActualCost())
                .createdAt(r.getCreatedAt())
                .completedAt(r.getCompletedAt())
                .build();
    }
}
