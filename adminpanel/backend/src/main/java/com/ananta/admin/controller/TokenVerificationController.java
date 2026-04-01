package com.ananta.admin.controller;

import com.ananta.admin.config.JwtUtils;
import com.ananta.admin.payload.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(
        origins = {
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/admin")
public class TokenVerificationController {

    @Autowired
    JwtUtils jwtUtils;

    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("No token provided"));
            }

            String token = authHeader.substring(7);
            
            if (jwtUtils.validateJwtToken(token)) {
                String email = jwtUtils.getUserNameFromJwtToken(token);
                Map<String, Object> response = new HashMap<>();
                response.put("valid", true);
                response.put("email", email);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Invalid token"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Server error"));
        }
    }
}