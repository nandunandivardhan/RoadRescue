package com.roadrescue.api.service.impl;

import com.roadrescue.api.dto.LocationUpdateRequest;
import com.roadrescue.api.dto.MechanicRegistrationDto;
import com.roadrescue.api.dto.MechanicResponseDto;
import com.roadrescue.api.entity.Mechanic;
import com.roadrescue.api.entity.User;
import com.roadrescue.api.exception.ResourceNotFoundException;
import com.roadrescue.api.repository.MechanicRepository;
import com.roadrescue.api.repository.UserRepository;
import com.roadrescue.api.service.MechanicService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MechanicServiceImpl implements MechanicService {

    private final MechanicRepository mechanicRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public MechanicResponseDto createMechanic(MechanicRegistrationDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .phone(dto.getPhone())
                .role(User.Role.MECHANIC)
                .build();

        user = userRepository.save(user);

        Mechanic mechanic = Mechanic.builder()
                .user(user)
                .specialty(dto.getSpecialty())
                .experienceYears(dto.getExperienceYears())
                .rating(5.00)
                .isOnline(true)
                .isAvailable(true)
                .latitude(12.9716)
                .longitude(77.5946)
                .build();

        mechanic = mechanicRepository.save(mechanic);
        return mapToResponseDto(mechanic, null);
    }

    @Override
    @Transactional(readOnly = true)
    public MechanicResponseDto getMechanicById(Long id) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic", "id", id));
        return mapToResponseDto(mechanic, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MechanicResponseDto> getAllMechanics() {
        return mechanicRepository.findAll().stream()
                .map(m -> mapToResponseDto(m, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MechanicResponseDto updateMechanic(Long id, MechanicRegistrationDto dto) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic", "id", id));
        
        User user = mechanic.getUser();
        user.setName(dto.getName());
        user.setPhone(dto.getPhone());
        userRepository.save(user);

        mechanic.setSpecialty(dto.getSpecialty());
        mechanic.setExperienceYears(dto.getExperienceYears());
        
        mechanic = mechanicRepository.save(mechanic);
        return mapToResponseDto(mechanic, null);
    }

    @Override
    @Transactional
    public void deleteMechanic(Long id) {
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mechanic", "id", id));
        mechanicRepository.delete(mechanic);
        userRepository.delete(mechanic.getUser());
    }

    @Override
    @Transactional
    public MechanicResponseDto updateLocation(Long id, LocationUpdateRequest request) {
        // We find by mechanic ID or user ID. Let's support looking up by user ID or mechanic ID.
        // Usually, the mobile app passes the user ID as "mechanicId" or updates its profile.
        // Let's implement robust finding by either mechanic id or user id:
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseGet(() -> mechanicRepository.findAll().stream()
                        .filter(m -> m.getUser().getId().equals(id))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Mechanic", "id or userId", id)));
        
        mechanic.setLatitude(request.getLatitude());
        mechanic.setLongitude(request.getLongitude());
        mechanic.setLastLocationUpdate(LocalDateTime.now());
        
        mechanic = mechanicRepository.save(mechanic);
        return mapToResponseDto(mechanic, null);
    }

    @Override
    @Transactional
    public MechanicResponseDto updateStatus(Long id, Boolean isOnline, Boolean isAvailable) {
        // Support finding by mechanic ID or user ID
        Mechanic mechanic = mechanicRepository.findById(id)
                .orElseGet(() -> mechanicRepository.findAll().stream()
                        .filter(m -> m.getUser().getId().equals(id))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Mechanic", "id or userId", id)));
        
        if (isOnline != null) mechanic.setIsOnline(isOnline);
        if (isAvailable != null) mechanic.setIsAvailable(isAvailable);
        
        mechanic = mechanicRepository.save(mechanic);
        return mapToResponseDto(mechanic, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MechanicResponseDto> findNearby(Double lat, Double lng, Double radius) {
        List<Object[]> results = mechanicRepository.findNearbyMechanics(lat, lng, radius);
        return results.stream().map(row -> {
            // MySQL native query indexes mapping from select query in MechanicRepository:
            // Row contents: 0: id, 1: user_id, 2: specialty, 3: experience_years, 4: rating,
            // 5: is_online, 6: is_available, 7: latitude, 8: longitude, 9: last_location_update, 10: distance
            Long id = ((Number) row[0]).longValue();
            Long userId = ((Number) row[1]).longValue();
            String specialty = (String) row[2];
            Integer experience = row[3] != null ? ((Number) row[3]).intValue() : 0;
            Double rating = row[4] != null ? ((Number) row[4]).doubleValue() : 5.0;
            Boolean isOnline = row[5] != null && (row[5] instanceof Boolean ? (Boolean) row[5] : ((Number) row[5]).intValue() == 1);
            Boolean isAvailable = row[6] != null && (row[6] instanceof Boolean ? (Boolean) row[6] : ((Number) row[6]).intValue() == 1);
            Double latitude = row[7] != null ? ((Number) row[7]).doubleValue() : 0.0;
            Double longitude = row[8] != null ? ((Number) row[8]).doubleValue() : 0.0;
            
            Double distance = row[10] != null ? ((Number) row[10]).doubleValue() : 0.0;

            // Map user details
            User user = userRepository.findById(userId).orElse(null);

            return MechanicResponseDto.builder()
                    .id(id)
                    .userId(userId)
                    .name(user != null ? user.getName() : "Unknown Mechanic")
                    .email(user != null ? user.getEmail() : "Unknown")
                    .phone(user != null ? user.getPhone() : "")
                    .specialty(specialty)
                    .experienceYears(experience)
                    .rating(rating)
                    .isOnline(isOnline)
                    .isAvailable(isAvailable)
                    .latitude(latitude)
                    .longitude(longitude)
                    .distance(distance)
                    .build();
        }).collect(Collectors.toList());
    }

    private MechanicResponseDto mapToResponseDto(Mechanic mechanic, Double distance) {
        return MechanicResponseDto.builder()
                .id(mechanic.getId())
                .userId(mechanic.getUser() != null ? mechanic.getUser().getId() : null)
                .name(mechanic.getUser() != null ? mechanic.getUser().getName() : "Unknown")
                .email(mechanic.getUser() != null ? mechanic.getUser().getEmail() : "Unknown")
                .phone(mechanic.getUser() != null ? mechanic.getUser().getPhone() : null)
                .specialty(mechanic.getSpecialty())
                .experienceYears(mechanic.getExperienceYears())
                .rating(mechanic.getRating())
                .isOnline(mechanic.getIsOnline())
                .isAvailable(mechanic.getIsAvailable())
                .latitude(mechanic.getLatitude())
                .longitude(mechanic.getLongitude())
                .distance(distance)
                .build();
    }
}
