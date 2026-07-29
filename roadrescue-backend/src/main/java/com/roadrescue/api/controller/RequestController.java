package com.roadrescue.api.controller;

import com.roadrescue.api.dto.ServiceRequestCreateDto;
import com.roadrescue.api.dto.ServiceRequestResponseDto;
import com.roadrescue.api.service.RequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RequestController {

    private final RequestService requestService;

    @PostMapping("/create")
    public ResponseEntity<ServiceRequestResponseDto> createRequest(@Valid @RequestBody ServiceRequestCreateDto dto) {
        return new ResponseEntity<>(requestService.createRequest(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceRequestResponseDto> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.getRequestById(id));
    }

    @GetMapping("/active/{userId}")
    public ResponseEntity<ServiceRequestResponseDto> getActiveRequest(
            @PathVariable Long userId,
            @RequestParam String role) {
        ServiceRequestResponseDto active = requestService.getActiveRequestForUser(userId, role);
        if (active == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(active);
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<ServiceRequestResponseDto> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(requestService.updateRequestStatus(id, status));
    }

    @PostMapping("/accept/{id}")
    public ResponseEntity<ServiceRequestResponseDto> acceptRequest(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Long> body) {
        Long mechanicUserId = body.get("mechanicUserId");
        return ResponseEntity.ok(requestService.acceptRequest(id, mechanicUserId));
    }

    @PostMapping("/cancel/{id}")
    public ResponseEntity<ServiceRequestResponseDto> cancelRequest(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.cancelRequest(id));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<ServiceRequestResponseDto>> getHistory(
            @PathVariable Long userId,
            @RequestParam String role) {
        return ResponseEntity.ok(requestService.getHistoryForUser(userId, role));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<ServiceRequestResponseDto>> getNearbyPendingRequests(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius) {
        return ResponseEntity.ok(requestService.getNearbyPendingRequests(lat, lng, radius));
    }

    @GetMapping
    public ResponseEntity<List<ServiceRequestResponseDto>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }
}
