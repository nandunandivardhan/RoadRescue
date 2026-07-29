package com.roadrescue.api.service;

import com.roadrescue.api.dto.AuthRequest;
import com.roadrescue.api.dto.AuthResponse;
import com.roadrescue.api.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(AuthRequest request);
}
