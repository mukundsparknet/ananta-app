package com.ananta.admin.controller;

import com.ananta.admin.config.JwtUtils;
import com.ananta.admin.model.Admin;
import com.ananta.admin.payload.JwtResponse;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.payload.LoginRequest;
import com.ananta.admin.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(
        origins = {
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000",
                "http://localhost:3011",
                "http://admin.anantalive.com",
                "https://admin.anantalive.com"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/admin")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    AdminRepository adminRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Admin admin = adminRepository.findByEmail(loginRequest.getEmail()).orElse(null);
        if (admin == null || !encoder.matches(loginRequest.getPassword(), admin.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid admin email or password"));
        }

        String jwt;
        try {
            jwt = jwtUtils.generateJwtToken(admin.getEmail());
        } catch (Exception e) {
            jwt = "dummy-token";
        }

        return ResponseEntity.ok(new JwtResponse(jwt,
                admin.getEmail(),
                admin.getRole()));
    }
}
