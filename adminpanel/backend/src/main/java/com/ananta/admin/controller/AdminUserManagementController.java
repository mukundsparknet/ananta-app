package com.ananta.admin.controller;

import com.ananta.admin.model.KYC;
import com.ananta.admin.model.User;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.repository.KYCRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.FollowRepository;
import com.ananta.admin.repository.WalletRepository;
import com.ananta.admin.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
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
@RequestMapping("/api/admin/users")
public class AdminUserManagementController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KYCRepository kycRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @GetMapping
    public Map<String, Object> getUsers() {
        List<User> users = userRepository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        return response;
    }

    @PatchMapping
    public ResponseEntity<?> updateUserFlags(@RequestBody Map<String, Object> payload) {
        Object idObj = payload.get("id");
        User user = null;
        if (idObj instanceof Number) {
            Long id = ((Number) idObj).longValue();
            user = userRepository.findById(id).orElse(null);
        } else if (idObj instanceof String) {
            try {
                Long id = Long.parseLong(((String) idObj).trim());
                user = userRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {
            }
        }

        if (user == null) {
            String userId = (String) payload.get("userId");
            String normalizedUserId = userId == null ? "" : userId.trim();
            if (normalizedUserId.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("userId is required"));
            }
            String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
            user = userRepository.findByUserId(normalizedUserId).orElse(null);
            if (user == null) {
                user = userRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
            }
            if (user == null && !compactUserId.isEmpty()) {
                user = userRepository.findByUserIdNormalized(compactUserId).orElse(null);
            }
        }

        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("User not found"));
        }

        // Check if user is currently banned and if ban has expired
        if (user.isBanned() && user.getBanUntil() != null) {
            if (LocalDateTime.now().isAfter(user.getBanUntil())) {
                user.setBanned(false);
                user.setBanUntil(null);
                user.setBanReason(null);
            }
        }

        if (payload.containsKey("isBlocked")) {
            Object value = payload.get("isBlocked");
            if (value instanceof Boolean) {
                user.setBlocked((Boolean) value);
            }
        }
        if (payload.containsKey("isBanned")) {
            Object value = payload.get("isBanned");
            if (value instanceof Boolean) {
                boolean banned = (Boolean) value;
                user.setBanned(banned);
                
                if (banned) {
                    // Get ban days from payload
                    Object banDaysObj = payload.get("banDays");
                    int banDays = 0;
                    if (banDaysObj instanceof Number) {
                        banDays = ((Number) banDaysObj).intValue();
                    } else if (banDaysObj instanceof String) {
                        try {
                            banDays = Integer.parseInt(((String) banDaysObj).trim());
                        } catch (NumberFormatException ignored) {
                        }
                    }
                    
                    if (banDays > 0) {
                        user.setBanUntil(LocalDateTime.now().plusDays(banDays));
                        user.setBanReason("Banned for " + banDays + " days");
                    } else {
                        // Permanent ban
                        user.setBanUntil(null);
                        user.setBanReason("Permanently banned");
                    }
                } else {
                    // Unban
                    user.setBanUntil(null);
                    user.setBanReason(null);
                }
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("User updated successfully"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserDetail(@PathVariable String userId) {
        String normalizedUserId = userId == null ? "" : userId.trim();
        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
        User user = userRepository.findByUserId(normalizedUserId).orElse(null);
        if (user == null) {
            user = userRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
        }
        if (user == null && !compactUserId.isEmpty()) {
            user = userRepository.findByUserIdNormalized(compactUserId).orElse(null);
        }
        if (user == null && !compactUserId.isEmpty()) {
            user = userRepository.findFirstByUserIdLikeNormalized(compactUserId).orElse(null);
        }
        if (user == null) {
            user = userRepository.findByUsername(normalizedUserId).orElse(null);
        }
        if (user == null) {
            user = userRepository.findByPhone(normalizedUserId).orElse(null);
        }
        if (user == null && !normalizedUserId.isEmpty()) {
            String key = normalizeUserIdValue(normalizedUserId);
            try {
                List<User> allUsers = userRepository.findAll();
                for (User candidate : allUsers) {
                    if (key.equals(normalizeUserIdValue(candidate.getUserId()))) {
                        user = candidate;
                        break;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        KYC kyc = kycRepository.findByUserId(normalizedUserId).orElse(null);
        if (kyc == null) {
            kyc = kycRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
        }
        if (kyc == null && !compactUserId.isEmpty()) {
            kyc = kycRepository.findByUserIdNormalized(compactUserId).orElse(null);
        }
        if (kyc == null && !compactUserId.isEmpty()) {
            kyc = kycRepository.findFirstByUserIdLikeNormalized(compactUserId).orElse(null);
        }
        if (kyc == null) {
            kyc = kycRepository.findByFullName(normalizedUserId).orElse(null);
        }
        if (kyc == null && !normalizedUserId.isEmpty()) {
            String key = normalizeUserIdValue(normalizedUserId);
            try {
                List<KYC> allKyc = kycRepository.findAll();
                for (KYC candidate : allKyc) {
                    if (key.equals(normalizeUserIdValue(candidate.getUserId()))) {
                        kyc = candidate;
                        break;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("kyc", kyc);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable String userId,
            @RequestBody User updated
    ) {
        String normalizedUserId = userId == null ? "" : userId.trim();
        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
        User user = userRepository.findByUserId(normalizedUserId)
                .orElseGet(() -> userRepository.findByUserIdTrimmed(normalizedUserId)
                        .orElse(null));
        if (user == null && !compactUserId.isEmpty()) {
            user = userRepository.findByUserIdNormalized(compactUserId).orElse(null);
        }
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        user.setUsername(updated.getUsername());
        user.setEmail(updated.getEmail());
        user.setFullName(updated.getFullName());
        user.setPhone(updated.getPhone());
        user.setGender(updated.getGender());
        user.setBirthday(updated.getBirthday());
        user.setBio(updated.getBio());
        user.setAddressLine1(updated.getAddressLine1());
        user.setCity(updated.getCity());
        user.setState(updated.getState());
        user.setCountry(updated.getCountry());
        user.setPinCode(updated.getPinCode());
        user.setLocation(updated.getLocation());

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("User updated successfully"));
    }

    @DeleteMapping("/{userId}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
        String normalizedUserId = userId == null ? "" : userId.trim();
        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");

        User user = userRepository.findByUserId(normalizedUserId).orElse(null);
        if (user == null) {
            user = userRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
        }
        if (user == null && !compactUserId.isEmpty()) {
            user = userRepository.findByUserIdNormalized(compactUserId).orElse(null);
        }
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("User not found"));
        }

        try {
            // Delete all related data
            String userIdToDelete = user.getUserId();
            
            // Delete wallet transactions
            walletTransactionRepository.findByUserId(userIdToDelete).forEach(walletTransactionRepository::delete);
            
            // Delete wallet
            walletRepository.findByUserId(userIdToDelete).ifPresent(walletRepository::delete);
            
            // Delete follows (both as follower and followee)
            followRepository.findByFollowerId(userIdToDelete).forEach(followRepository::delete);
            followRepository.findByFolloweeId(userIdToDelete).forEach(followRepository::delete);
            
            // Delete KYC records
            kycRepository.findByUserId(userIdToDelete).ifPresent(kycRepository::delete);
            kycRepository.findByUserIdTrimmed(userIdToDelete).ifPresent(kycRepository::delete);
            if (!compactUserId.isEmpty()) {
                kycRepository.findByUserIdNormalized(compactUserId).ifPresent(kycRepository::delete);
            }
            
            // Finally delete the user
            userRepository.delete(user);
            
            return ResponseEntity.ok(new MessageResponse("User permanently deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new MessageResponse("Error deleting user: " + e.getMessage()));
        }
    }

    private String normalizeUserIdValue(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^A-Za-z0-9]", "").toUpperCase(java.util.Locale.ROOT);
    }
}
