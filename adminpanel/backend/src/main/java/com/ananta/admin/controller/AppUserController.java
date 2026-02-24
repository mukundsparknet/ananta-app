package com.ananta.admin.controller;

import com.ananta.admin.model.KYC;
import com.ananta.admin.model.User;
import com.ananta.admin.model.Follow;
import com.ananta.admin.payload.KycStatusResponse;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.payload.OtpVerifyRequest;
import com.ananta.admin.payload.OtpVerifyResponse;
import com.ananta.admin.payload.RegisterRequest;
import com.ananta.admin.payload.UpdateProfileRequest;
import com.ananta.admin.repository.KYCRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.FollowRepository;
import com.ananta.admin.repository.WalletRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/app")
public class AppUserController {

    private static final String FIXED_OTP = "12345";
    private static final String UPLOAD_DIR = Paths.get(System.getProperty("user.dir"))
            .getParent()
            .resolve("public")
            .resolve("uploads")
            .toString();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KYCRepository kycRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private WalletRepository walletRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @PostConstruct
    public void initUploadDir() {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "ANANTA Backend");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        if (!StringUtils.hasText(request.getPhone()) || !StringUtils.hasText(request.getOtp())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Phone and OTP are required"));
        }

        if (!FIXED_OTP.equals(request.getOtp())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP"));
        }

        String phone = request.getPhone().trim();

        User user = null;
        try {
            user = userRepository.findByPhone(phone).orElse(null);
        } catch (Exception ignored) {
        }
        if (user == null) {
            user = findUserByPhoneNative(phone);
        }
        if (user == null) {
            try {
                User u = new User();
                u.setPhone(phone);
                String suffix = phone.length() > 4 ? phone.substring(phone.length() - 4) : phone;
                u.setUsername("user_" + suffix);
                u.setUserId(generateUserId());
                user = userRepository.save(u);
            } catch (Exception ignored) {
            }
        }
        if (user == null) {
            user = findUserByPhoneNative(phone);
        }

        String userId = user != null ? user.getUserId() : "";
        KYC kyc = findKycByUserIdLoose(userId);
        String kycStatus = kyc != null && kyc.getStatus() != null ? kyc.getStatus().name() : "NONE";
        boolean hasProfile = user != null && StringUtils.hasText(user.getFullName());

        return ResponseEntity.ok(new OtpVerifyResponse(
                userId,
                phone,
                kycStatus,
                hasProfile
        ));
    }

    @GetMapping("/db-check/{userId}")
    public ResponseEntity<?> dbCheck(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        String normalizedUserId = userId == null ? "" : userId.trim();
        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");

        try {
            Object db = entityManager.createNativeQuery("select current_database()").getSingleResult();
            response.put("database", db);
        } catch (Exception e) {
            response.put("database", null);
        }

        try {
            Number usersCount = (Number) entityManager.createNativeQuery("select count(*) from users").getSingleResult();
            Number kycCount = (Number) entityManager.createNativeQuery("select count(*) from kyc_records").getSingleResult();
            response.put("usersCount", usersCount.longValue());
            response.put("kycCount", kycCount.longValue());
        } catch (Exception e) {
            response.put("usersCount", null);
            response.put("kycCount", null);
        }

        try {
            List<User> users = userRepository.findAll();
            response.put("repoUsersCount", users.size());
            response.put("repoFirstUserId", users.isEmpty() ? null : users.get(0).getUserId());
        } catch (Exception e) {
            response.put("repoUsersCount", null);
            response.put("repoFirstUserId", null);
        }

        try {
            List<KYC> kycs = kycRepository.findAll();
            response.put("repoKycCount", kycs.size());
            response.put("repoFirstKycUserId", kycs.isEmpty() ? null : kycs.get(0).getUserId());
        } catch (Exception e) {
            response.put("repoKycCount", null);
            response.put("repoFirstKycUserId", null);
        }

        response.put("requestedUserId", normalizedUserId);
        response.put("compactUserId", compactUserId);

        try {
            response.put("repoFindByUserId", userRepository.findByUserId(normalizedUserId).map(User::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByUserId", null);
        }

        try {
            response.put("repoFindByUserIdTrimmed", userRepository.findByUserIdTrimmed(normalizedUserId).map(User::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByUserIdTrimmed", null);
        }

        try {
            response.put("repoFindByUserIdNormalized", userRepository.findByUserIdNormalized(compactUserId).map(User::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByUserIdNormalized", null);
        }

        try {
            response.put("repoFindByUserIdLikeNormalized", userRepository.findFirstByUserIdLikeNormalized(compactUserId).map(User::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByUserIdLikeNormalized", null);
        }

        try {
            response.put("repoFindByKycUserId", kycRepository.findByUserId(normalizedUserId).map(KYC::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByKycUserId", null);
        }

        try {
            response.put("repoFindByKycUserIdTrimmed", kycRepository.findByUserIdTrimmed(normalizedUserId).map(KYC::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByKycUserIdTrimmed", null);
        }

        try {
            response.put("repoFindByKycUserIdNormalized", kycRepository.findByUserIdNormalized(compactUserId).map(KYC::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByKycUserIdNormalized", null);
        }

        try {
            response.put("repoFindByKycUserIdLikeNormalized", kycRepository.findFirstByUserIdLikeNormalized(compactUserId).map(KYC::getUserId).orElse(null));
        } catch (Exception e) {
            response.put("repoFindByKycUserIdLikeNormalized", null);
        }

        try {
            Number exactUser = (Number) entityManager.createNativeQuery("select count(*) from users where user_id = :id")
                    .setParameter("id", normalizedUserId)
                    .getSingleResult();
            response.put("exactUserMatch", exactUser.longValue());
        } catch (Exception e) {
            response.put("exactUserMatch", null);
        }

        try {
            Number exactKyc = (Number) entityManager.createNativeQuery("select count(*) from kyc_records where user_id = :id")
                    .setParameter("id", normalizedUserId)
                    .getSingleResult();
            response.put("exactKycMatch", exactKyc.longValue());
        } catch (Exception e) {
            response.put("exactKycMatch", null);
        }

        try {
            Object normUser = entityManager.createNativeQuery(
                            "select user_id from users where upper(regexp_replace(user_id, '[^A-Za-z0-9]', '', 'g')) = upper(:id) limit 1")
                    .setParameter("id", compactUserId)
                    .getResultList()
                    .stream()
                    .findFirst()
                    .orElse(null);
            response.put("normalizedUserMatch", normUser);
        } catch (Exception e) {
            response.put("normalizedUserMatch", null);
        }

        try {
            Object normKyc = entityManager.createNativeQuery(
                            "select user_id from kyc_records where upper(regexp_replace(user_id, '[^A-Za-z0-9]', '', 'g')) = upper(:id) limit 1")
                    .setParameter("id", compactUserId)
                    .getResultList()
                    .stream()
                    .findFirst()
                    .orElse(null);
            response.put("normalizedKycMatch", normKyc);
        } catch (Exception e) {
            response.put("normalizedKycMatch", null);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String normalizedUserId = request.getUserId() != null ? request.getUserId().trim() : "";
        if (!StringUtils.hasText(normalizedUserId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("UserId is required"));
        }
        if (!StringUtils.hasText(request.getUsername())
                || !StringUtils.hasText(request.getEmail())
                || !StringUtils.hasText(request.getDocumentType())
                || !StringUtils.hasText(request.getDocumentNumber())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Please fill all required fields"));
        }

        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
        Optional<User> userOpt = userRepository.findByUserId(normalizedUserId);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUserIdTrimmed(normalizedUserId);
        }
        if (userOpt.isEmpty() && StringUtils.hasText(compactUserId)) {
            userOpt = userRepository.findByUserIdNormalized(compactUserId);
        }
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found for registration"));

        String username = request.getUsername().trim();
        String fullName = StringUtils.hasText(request.getFullName())
                ? request.getFullName().trim()
                : username;

        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(request.getEmail().trim());
        user.setGender(request.getGender());
        user.setBirthday(request.getBirthday());
        user.setBio(request.getBio());
        user.setAddressLine1(request.getAddressLine1());
        user.setCity(request.getCity());
        user.setState(request.getState());
        user.setCountry(request.getCountry());
        user.setPinCode(request.getPinCode());
        user.setLocation(request.getLocation());

        String profileImagePath = saveBase64Image(request.getProfileImage(), "profile", user.getUserId());
        if (StringUtils.hasText(profileImagePath)) {
            user.setProfileImage(profileImagePath);
        } else if (StringUtils.hasText(request.getProfileImage())) {
            user.setProfileImage(request.getProfileImage());
        }

        userRepository.save(user);

        KYC kyc = kycRepository.findByUserId(user.getUserId())
                .orElseGet(() -> {
                    KYC k = new KYC();
                    k.setUserId(user.getUserId());
                    return k;
                });

        kyc.setFullName(fullName);
        kyc.setDocumentType(mapDocumentType(request.getDocumentType()));
        kyc.setDocumentNumber(request.getDocumentNumber().trim());

        String frontPath = saveBase64Image(request.getDocumentFrontImage(), "doc_front", user.getUserId());
        String backPath = saveBase64Image(request.getDocumentBackImage(), "doc_back", user.getUserId());
        if (StringUtils.hasText(frontPath)) {
            kyc.setDocumentFrontImage(frontPath);
        } else if (StringUtils.hasText(request.getDocumentFrontImage())) {
            kyc.setDocumentFrontImage(request.getDocumentFrontImage());
        }
        if (StringUtils.hasText(backPath)) {
            kyc.setDocumentBackImage(backPath);
        } else if (StringUtils.hasText(request.getDocumentBackImage())) {
            kyc.setDocumentBackImage(request.getDocumentBackImage());
        }
        kyc.setStatus(KYC.KYCStatus.PENDING);

        kycRepository.save(kyc);

        return ResponseEntity.ok(new MessageResponse("KYC submitted, pending review"));
    }

    @GetMapping("/kyc-status/{userId}")
    public ResponseEntity<?> getKycStatus(@PathVariable String userId) {
        try {
            String normalizedUserId = userId == null ? "" : userId.trim();
            if (!StringUtils.hasText(normalizedUserId)) {
                return ResponseEntity.ok(new KycStatusResponse(userId, "NONE"));
            }
            KYC kyc = findKycByUserIdLoose(normalizedUserId);
            String status = kyc != null && kyc.getStatus() != null ? kyc.getStatus().name() : "NONE";
            return ResponseEntity.ok(new KycStatusResponse(normalizedUserId, status));
        } catch (Exception e) {
            return ResponseEntity.ok(new KycStatusResponse(userId, "NONE"));
        }
    }

    @PostMapping("/profile")
    @Transactional
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        try {
            System.out.println("POST /api/app/profile called with userId: " + request.getUserId());
            
            String normalizedUserId = request.getUserId() != null ? request.getUserId().trim() : "";
            if (!StringUtils.hasText(normalizedUserId)) {
                return ResponseEntity.badRequest().body(new MessageResponse("UserId is required"));
            }

            // Find user first
            Optional<User> userOpt = userRepository.findByUserId(normalizedUserId);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUserIdTrimmed(normalizedUserId);
            }
            if (userOpt.isEmpty()) {
                String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
                if (StringUtils.hasText(compactUserId)) {
                    userOpt = userRepository.findByUserIdNormalized(compactUserId);
                }
            }
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(new MessageResponse("User not found"));
            }

            User user = userOpt.get();
            
            // Update fields
            if (StringUtils.hasText(request.getUsername())) {
                user.setUsername(request.getUsername().trim());
            }
            if (StringUtils.hasText(request.getFullName())) {
                user.setFullName(request.getFullName().trim());
            }
            user.setBio(request.getBio());
            user.setLocation(request.getLocation());
            user.setGender(request.getGender());
            user.setBirthday(request.getBirthday());
            user.setAddressLine1(request.getAddressLine1());
            user.setCity(request.getCity());
            user.setState(request.getState());
            user.setCountry(request.getCountry());
            user.setPinCode(request.getPinCode());

            // Handle profile image
            if (StringUtils.hasText(request.getProfileImage())) {
                String imageToSave = request.getProfileImage();
                if (imageToSave.startsWith("data:image")) {
                    String savedPath = saveBase64Image(imageToSave, "profile", normalizedUserId);
                    if (StringUtils.hasText(savedPath)) {
                        user.setProfileImage(savedPath);
                    }
                } else if (imageToSave.startsWith("/uploads/") || imageToSave.startsWith("http")) {
                    user.setProfileImage(imageToSave);
                }
            }

            // Handle cover image
            if (StringUtils.hasText(request.getCoverImage())) {
                String coverToSave = request.getCoverImage();
                if (coverToSave.startsWith("data:image")) {
                    String savedPath = saveBase64Image(coverToSave, "cover", normalizedUserId);
                    if (StringUtils.hasText(savedPath)) {
                        user.setCoverImage(savedPath);
                    }
                } else if (coverToSave.startsWith("/uploads/") || coverToSave.startsWith("http")) {
                    user.setCoverImage(coverToSave);
                }
            }

            userRepository.save(user);
            entityManager.flush();

            return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(new MessageResponse("Server error: " + e.getMessage()));
        }
    }

    @RequestMapping(value = "/profile", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleProfileOptions() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        String normalizedUserId = userId == null ? "" : userId.trim();
        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
        User user = null;
        try {
            if (StringUtils.hasText(normalizedUserId)) {
                user = userRepository.findByUserId(normalizedUserId).orElse(null);
                if (user == null) {
                    user = userRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
                }
                if (user == null && StringUtils.hasText(compactUserId)) {
                    user = userRepository.findByUserIdNormalized(compactUserId).orElse(null);
                }
                if (user == null && StringUtils.hasText(compactUserId)) {
                    user = userRepository.findFirstByUserIdLikeNormalized(compactUserId).orElse(null);
                }
            }
            if (user == null) {
                user = userRepository.findByUsername(normalizedUserId).orElse(null);
            }
            if (user == null) {
                user = userRepository.findByPhone(normalizedUserId).orElse(null);
            }
        } catch (Exception ignored) {
        }
        if (user == null && StringUtils.hasText(normalizedUserId)) {
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
        if (user == null && StringUtils.hasText(normalizedUserId)) {
            try {
                List<?> rows = entityManager.createNativeQuery(
                                "select user_id, username, email, phone, full_name, gender, birthday, bio, address_line1, city, state, country, pin_code, location, profile_image, is_blocked, is_banned " +
                                        "from users where user_id = :id limit 1")
                        .setParameter("id", normalizedUserId)
                        .getResultList();
                if (!rows.isEmpty()) {
                    Object[] r = (Object[]) rows.get(0);
                    User u = new User();
                    u.setUserId(r[0] != null ? r[0].toString() : null);
                    u.setUsername(r[1] != null ? r[1].toString() : null);
                    u.setEmail(r[2] != null ? r[2].toString() : null);
                    u.setPhone(r[3] != null ? r[3].toString() : null);
                    u.setFullName(r[4] != null ? r[4].toString() : null);
                    u.setGender(r[5] != null ? r[5].toString() : null);
                    u.setBirthday(r[6] != null ? r[6].toString() : null);
                    u.setBio(r[7] != null ? r[7].toString() : null);
                    u.setAddressLine1(r[8] != null ? r[8].toString() : null);
                    u.setCity(r[9] != null ? r[9].toString() : null);
                    u.setState(r[10] != null ? r[10].toString() : null);
                    u.setCountry(r[11] != null ? r[11].toString() : null);
                    u.setPinCode(r[12] != null ? r[12].toString() : null);
                    u.setLocation(r[13] != null ? r[13].toString() : null);
                    u.setProfileImage(r[14] != null ? r[14].toString() : null);
                    if (r[15] instanceof Boolean) {
                        u.setBlocked((Boolean) r[15]);
                    }
                    if (r[16] instanceof Boolean) {
                        u.setBanned((Boolean) r[16]);
                    }
                    user = u;
                }
            } catch (Exception ignored) {
            }
        }

        KYC kyc = null;
        try {
            if (StringUtils.hasText(normalizedUserId)) {
                kyc = kycRepository.findByUserId(normalizedUserId).orElse(null);
                if (kyc == null) {
                    kyc = kycRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
                }
                if (kyc == null && StringUtils.hasText(compactUserId)) {
                    kyc = kycRepository.findByUserIdNormalized(compactUserId).orElse(null);
                }
                if (kyc == null && StringUtils.hasText(compactUserId)) {
                    kyc = kycRepository.findFirstByUserIdLikeNormalized(compactUserId).orElse(null);
                }
            }
            if (kyc == null) {
                kyc = kycRepository.findByFullName(normalizedUserId).orElse(null);
            }
        } catch (Exception ignored) {
        }
        if (kyc == null && StringUtils.hasText(normalizedUserId)) {
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
        if (kyc == null && StringUtils.hasText(normalizedUserId)) {
            try {
                List<?> rows = entityManager.createNativeQuery(
                                "select user_id, full_name, document_type, document_number, document_front_image, document_back_image, status " +
                                        "from kyc_records where user_id = :id limit 1")
                        .setParameter("id", normalizedUserId)
                        .getResultList();
                if (!rows.isEmpty()) {
                    Object[] r = (Object[]) rows.get(0);
                    KYC k = new KYC();
                    k.setUserId(r[0] != null ? r[0].toString() : null);
                    k.setFullName(r[1] != null ? r[1].toString() : null);
                    if (r[2] != null) {
                        try {
                            k.setDocumentType(KYC.DocumentType.valueOf(r[2].toString()));
                        } catch (Exception ignored) {
                        }
                    }
                    k.setDocumentNumber(r[3] != null ? r[3].toString() : null);
                    k.setDocumentFrontImage(r[4] != null ? r[4].toString() : null);
                    k.setDocumentBackImage(r[5] != null ? r[5].toString() : null);
                    if (r[6] != null) {
                        try {
                            k.setStatus(KYC.KYCStatus.valueOf(r[6].toString()));
                        } catch (Exception ignored) {
                        }
                    }
                    kyc = k;
                }
            } catch (Exception ignored) {
            }
        }

        if (user == null && kyc != null) {
            User u = new User();
            u.setUserId(normalizedUserId);
            String name = kyc.getFullName();
            if (name != null && !name.trim().isEmpty()) {
                u.setUsername(name);
                u.setFullName(name);
            } else {
                String fallback = normalizedUserId.length() > 4
                        ? normalizedUserId.substring(normalizedUserId.length() - 4)
                        : normalizedUserId;
                u.setUsername("user_" + fallback);
                u.setFullName("user_" + fallback);
            }
            u.setPhone(normalizedUserId);
            user = u;
        }

        long followers = 0L;
        long following = 0L;
        double coins = 0.0;
        List<Map<String, Object>> followersList = List.of();
        List<Map<String, Object>> followingList = List.of();
        try {
            followers = followRepository.countByFolloweeId(normalizedUserId);
            following = followRepository.countByFollowerId(normalizedUserId);
            coins = walletRepository.findByUserId(normalizedUserId)
                    .map(w -> w.getBalance() != null ? w.getBalance() : 0.0)
                    .orElse(0.0);

            followersList = followRepository.findByFolloweeId(normalizedUserId).stream().map(f -> {
                Map<String, Object> m = new HashMap<>();
                String followerId = f.getFollowerId();
                m.put("userId", followerId);

                String username = null;
                String fullName = null;
                String profileImage = null;
                try {
                    Optional<User> followerOpt = userRepository.findByUserId(followerId);
                    if (followerOpt.isPresent()) {
                        User u = followerOpt.get();
                        username = u.getUsername();
                        fullName = u.getFullName();
                        profileImage = u.getProfileImage();
                    }
                } catch (Exception ignored) {
                }
                if (!StringUtils.hasText(username) && !StringUtils.hasText(fullName)) {
                    try {
                        KYC followerKyc = findKycByUserIdLoose(followerId);
                        if (followerKyc != null && StringUtils.hasText(followerKyc.getFullName())) {
                            fullName = followerKyc.getFullName();
                            username = followerKyc.getFullName();
                        }
                    } catch (Exception ignored) {
                    }
                }
                if (StringUtils.hasText(username)) {
                    m.put("username", username);
                }
                if (StringUtils.hasText(fullName)) {
                    m.put("fullName", fullName);
                }
                if (StringUtils.hasText(profileImage)) {
                    m.put("profileImage", profileImage);
                }

                boolean isFollowingBack = followRepository.existsByFollowerIdAndFolloweeId(normalizedUserId, followerId);
                m.put("isFollowing", isFollowingBack);
                return m;
            }).collect(Collectors.toList());

            followingList = followRepository.findByFollowerId(normalizedUserId).stream().map(f -> {
                Map<String, Object> m = new HashMap<>();
                String followeeId = f.getFolloweeId();
                m.put("userId", followeeId);

                String username = null;
                String fullName = null;
                String profileImage = null;
                try {
                    Optional<User> followeeOpt = userRepository.findByUserId(followeeId);
                    if (followeeOpt.isPresent()) {
                        User u = followeeOpt.get();
                        username = u.getUsername();
                        fullName = u.getFullName();
                        profileImage = u.getProfileImage();
                    }
                } catch (Exception ignored) {
                }
                if (!StringUtils.hasText(username) && !StringUtils.hasText(fullName)) {
                    try {
                        KYC followeeKyc = findKycByUserIdLoose(followeeId);
                        if (followeeKyc != null && StringUtils.hasText(followeeKyc.getFullName())) {
                            fullName = followeeKyc.getFullName();
                            username = followeeKyc.getFullName();
                        }
                    } catch (Exception ignored) {
                    }
                }
                if (StringUtils.hasText(username)) {
                    m.put("username", username);
                }
                if (StringUtils.hasText(fullName)) {
                    m.put("fullName", fullName);
                }
                if (StringUtils.hasText(profileImage)) {
                    m.put("profileImage", profileImage);
                }

                return m;
            }).collect(Collectors.toList());
        } catch (Exception ignored) {
        }

        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("kyc", kyc);
        response.put("followers", followers);
        response.put("following", following);
        response.put("coins", coins);
        response.put("followersList", followersList);
        response.put("followingList", followingList);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<?> getFollowersList(@PathVariable String userId) {
        try {
            String normalizedUserId = normalizeUserIdValue(userId);
            List<Follow> follows = followRepository.findByFolloweeId(normalizedUserId);
            List<Map<String, Object>> items = follows.stream().map(f -> {
                Map<String, Object> m = new HashMap<>();
                String followerId = f.getFollowerId();
                m.put("userId", followerId);
                Optional<User> followerOpt = userRepository.findByUserId(followerId);
                followerOpt.ifPresent(u -> {
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("profileImage", u.getProfileImage());
                });
                boolean isFollowingBack = followRepository.existsByFollowerIdAndFolloweeId(normalizedUserId, followerId);
                m.put("isFollowing", isFollowingBack);
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<?> getFollowingList(@PathVariable String userId) {
        try {
            String normalizedUserId = normalizeUserIdValue(userId);
            List<Follow> follows = followRepository.findByFollowerId(normalizedUserId);
            List<Map<String, Object>> items = follows.stream().map(f -> {
                Map<String, Object> m = new HashMap<>();
                String followeeId = f.getFolloweeId();
                m.put("userId", followeeId);
                Optional<User> followeeOpt = userRepository.findByUserId(followeeId);
                followeeOpt.ifPresent(u -> {
                    m.put("username", u.getUsername());
                    m.put("fullName", u.getFullName());
                    m.put("profileImage", u.getProfileImage());
                });
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/follow/toggle")
    public ResponseEntity<?> toggleFollow(@RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String followerIdRaw = payload.get("followerId");
            String followeeIdRaw = payload.get("followeeId");

            if (!StringUtils.hasText(followerIdRaw) || !StringUtils.hasText(followeeIdRaw)) {
                response.put("isFollowing", false);
                response.put("message", "followerId and followeeId are required");
                return ResponseEntity.ok(response);
            }
            String followerId = normalizeUserIdValue(followerIdRaw);
            String followeeId = normalizeUserIdValue(followeeIdRaw);
            if (followerId.equals(followeeId)) {
                response.put("isFollowing", false);
                response.put("message", "User cannot follow themselves");
                return ResponseEntity.ok(response);
            }

            boolean exists = followRepository.existsByFollowerIdAndFolloweeId(followerId, followeeId);
            boolean isFollowing;
            if (exists) {
                followRepository.deleteByFollowerIdAndFolloweeId(followerId, followeeId);
                isFollowing = false;
            } else {
                Follow follow = new Follow();
                follow.setFollowerId(followerId);
                follow.setFolloweeId(followeeId);
                followRepository.save(follow);
                isFollowing = true;
            }

            response.put("isFollowing", isFollowing);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("isFollowing", false);
            response.put("message", "Unable to toggle follow");
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/follow/clear-all")
    public ResponseEntity<?> clearAllFollows() {
        try {
            followRepository.deleteAll();
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");
            response.put("cleared", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("cleared", false);
            return ResponseEntity.ok(response);
        }
    }

    private KYC.DocumentType mapDocumentType(String documentType) {
        if (!StringUtils.hasText(documentType)) {
            return KYC.DocumentType.AADHAR;
        }
        String value = documentType.trim().toUpperCase(Locale.ROOT);
        if (value.contains("AADHAAR") || value.contains("AADHAR")) {
            return KYC.DocumentType.AADHAR;
        }
        if (value.contains("PASSPORT")) {
            return KYC.DocumentType.PASSPORT;
        }
        if (value.contains("DRIVING")) {
            return KYC.DocumentType.DRIVING_LICENSE;
        }
        return KYC.DocumentType.AADHAR;
    }

    private String normalizeUserIdValue(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
    }

    private KYC findKycByUserIdLoose(String userId) {
        if (!StringUtils.hasText(userId)) {
            return null;
        }
        String normalizedUserId = userId.trim();
        String compactUserId = normalizedUserId.replaceAll("[^A-Za-z0-9]", "");
        KYC kyc = null;
        try {
            kyc = kycRepository.findByUserId(normalizedUserId).orElse(null);
            if (kyc == null) {
                kyc = kycRepository.findByUserIdTrimmed(normalizedUserId).orElse(null);
            }
            if (kyc == null && StringUtils.hasText(compactUserId)) {
                kyc = kycRepository.findByUserIdNormalized(compactUserId).orElse(null);
            }
            if (kyc == null && StringUtils.hasText(compactUserId)) {
                kyc = kycRepository.findFirstByUserIdLikeNormalized(compactUserId).orElse(null);
            }
        } catch (Exception ignored) {
        }
        if (kyc == null) {
            try {
                String key = normalizeUserIdValue(normalizedUserId);
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
        if (kyc == null) {
            try {
                List<?> rows = entityManager.createNativeQuery(
                                "select user_id, full_name, document_type, document_number, document_front_image, document_back_image, status " +
                                        "from kyc_records where user_id = :id limit 1")
                        .setParameter("id", normalizedUserId)
                        .getResultList();
                if (!rows.isEmpty()) {
                    Object[] r = (Object[]) rows.get(0);
                    KYC k = new KYC();
                    k.setUserId(r[0] != null ? r[0].toString() : null);
                    k.setFullName(r[1] != null ? r[1].toString() : null);
                    if (r[2] != null) {
                        try {
                            k.setDocumentType(KYC.DocumentType.valueOf(r[2].toString()));
                        } catch (Exception ignored) {
                        }
                    }
                    k.setDocumentNumber(r[3] != null ? r[3].toString() : null);
                    k.setDocumentFrontImage(r[4] != null ? r[4].toString() : null);
                    k.setDocumentBackImage(r[5] != null ? r[5].toString() : null);
                    if (r[6] != null) {
                        try {
                            k.setStatus(KYC.KYCStatus.valueOf(r[6].toString()));
                        } catch (Exception ignored) {
                        }
                    }
                    kyc = k;
                }
            } catch (Exception ignored) {
            }
        }
        return kyc;
    }

    private User findUserByPhoneNative(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }
        try {
            List<?> rows = entityManager.createNativeQuery(
                            "select user_id, username, phone, full_name from users where phone = :phone limit 1")
                    .setParameter("phone", phone)
                    .getResultList();
            if (!rows.isEmpty()) {
                Object[] r = (Object[]) rows.get(0);
                User u = new User();
                u.setUserId(r[0] != null ? r[0].toString() : null);
                u.setUsername(r[1] != null ? r[1].toString() : null);
                u.setPhone(r[2] != null ? r[2].toString() : null);
                u.setFullName(r[3] != null ? r[3].toString() : null);
                return u;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String saveBase64Image(String base64, String prefix, String userId) {
        if (!StringUtils.hasText(base64)) {
            return null;
        }
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            Files.createDirectories(uploadPath);
            String value = base64.trim();
            int commaIndex = value.indexOf(',');
            if (value.startsWith("data:") && commaIndex != -1) {
                value = value.substring(commaIndex + 1);
            }
            byte[] data = Base64.getDecoder().decode(value);
            String filename = prefix + "_" + userId + "_" + System.currentTimeMillis() + ".jpg";
            Path filePath = uploadPath.resolve(filename);
            Files.write(filePath, data);
            return "/uploads/" + filename;
        } catch (Exception e) {
            return null;
        }
    }

    private String generateUserId() {
        String suffix = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "AN" + suffix;
    }
}
