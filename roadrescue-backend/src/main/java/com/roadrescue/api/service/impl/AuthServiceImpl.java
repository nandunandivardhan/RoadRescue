package com.roadrescue.api.service.impl;

import com.roadrescue.api.dto.AuthRequest;
import com.roadrescue.api.dto.AuthResponse;
import com.roadrescue.api.dto.RegisterRequest;
import com.roadrescue.api.entity.Mechanic;
import com.roadrescue.api.entity.User;
import com.roadrescue.api.repository.MechanicRepository;
import com.roadrescue.api.repository.UserRepository;
import com.roadrescue.api.security.CustomUserDetailsService;
import com.roadrescue.api.security.JwtService;
import com.roadrescue.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final MechanicRepository mechanicRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User.Role role = User.Role.USER;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            // Default to USER
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .build();

        user = userRepository.save(user);

        // If the registering user is a mechanic, automatically initialize their mechanic details
        if (role == User.Role.MECHANIC) {
            Mechanic mechanic = Mechanic.builder()
                    .user(user)
                    .specialty(request.getSpecialty() != null ? request.getSpecialty() : "General Assistance")
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 1)
                    .rating(5.0)
                    .isOnline(true) // Online by default on signup for easy demo
                    .isAvailable(true)
                    .latitude(12.9716) // Default coordinate to Bangalore (adjustable)
                    .longitude(77.5946)
                    .build();
            mechanicRepository.save(mechanic);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // If user is a mechanic, automatically mark them online on login for easy demoing
        if (user.getRole() == User.Role.MECHANIC) {
            mechanicRepository.findAll().stream()
                    .filter(m -> m.getUser().getId().equals(user.getId()))
                    .findFirst()
                    .ifPresent(m -> {
                        m.setIsOnline(true);
                        m.setIsAvailable(true);
                        mechanicRepository.save(m);
                    });
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
