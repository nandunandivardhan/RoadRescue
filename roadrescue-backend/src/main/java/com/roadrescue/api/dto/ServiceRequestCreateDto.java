package com.roadrescue.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequestCreateDto {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Issue type is required")
    private String issueType;

    private String description;

    @NotNull(message = "Pickup latitude is required")
    private Double pickupLatitude;

    @NotNull(message = "Pickup longitude is required")
    private Double pickupLongitude;

    private String pickupAddress;

    private Double estimatedCost;
}
