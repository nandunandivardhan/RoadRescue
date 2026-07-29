package com.roadrescue.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequestResponseDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    
    private Long mechanicId;
    private String mechanicName;
    private String mechanicPhone;
    private Double mechanicLatitude;
    private Double mechanicLongitude;

    private String issueType;
    private String description;
    private String status;

    private Double pickupLatitude;
    private Double pickupLongitude;
    private String pickupAddress;

    private Double estimatedCost;
    private Double actualCost;

    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
