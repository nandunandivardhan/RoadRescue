package com.roadrescue.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MechanicResponseDto {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String specialty;
    private Integer experienceYears;
    private Double rating;
    private Boolean isOnline;
    private Boolean isAvailable;
    private Double latitude;
    private Double longitude;
    private Double distance; // calculated distance for geosearches
}
