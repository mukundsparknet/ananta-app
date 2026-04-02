package com.ananta.admin.controller;

import com.ananta.admin.model.AppSettings;
import com.ananta.admin.repository.AppSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(
        origins = {
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3011"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/admin/app-settings")
public class AdminAppSettingsController {

    @Autowired
    private AppSettingsRepository appSettingsRepository;

    @GetMapping
    public ResponseEntity<?> getSettings() {
        AppSettings settings = appSettingsRepository.findAll().stream().findFirst()
                .orElse(new AppSettings());
        Map<String, Object> response = new HashMap<>();
        response.put("signupBonus", settings.getSignupBonus());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Integer> payload) {
        AppSettings settings = appSettingsRepository.findAll().stream().findFirst()
                .orElse(new AppSettings());
        settings.setSignupBonus(payload.getOrDefault("signupBonus", 0));
        AppSettings saved = appSettingsRepository.save(settings);
        Map<String, Object> response = new HashMap<>();
        response.put("signupBonus", saved.getSignupBonus());
        response.put("message", "Settings saved successfully");
        return ResponseEntity.ok(response);
    }
}
