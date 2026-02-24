// Alternative implementation for AppUserController.java updateProfile method
// This version uses native queries more safely

@PostMapping("/profile")
@Transactional
public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
    try {
        System.out.println("POST /api/app/profile called with userId: " + request.getUserId());
        
        String normalizedUserId = request.getUserId() != null ? request.getUserId().trim() : "";
        if (!StringUtils.hasText(normalizedUserId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("UserId is required"));
        }

        // Build dynamic update query
        StringBuilder sql = new StringBuilder("UPDATE users SET updated_at = CURRENT_TIMESTAMP");
        Map<String, Object> params = new HashMap<>();
        
        if (StringUtils.hasText(request.getUsername())) {
            sql.append(", username = :username");
            params.put("username", request.getUsername().trim());
        }
        
        if (StringUtils.hasText(request.getFullName())) {
            sql.append(", full_name = :fullName");
            params.put("fullName", request.getFullName().trim());
        }
        
        sql.append(", bio = :bio");
        params.put("bio", request.getBio() != null ? request.getBio() : "");
        
        sql.append(", location = :location");
        params.put("location", request.getLocation() != null ? request.getLocation() : "");
        
        sql.append(", gender = :gender");
        params.put("gender", request.getGender() != null ? request.getGender() : "");
        
        sql.append(", birthday = :birthday");
        params.put("birthday", request.getBirthday() != null ? request.getBirthday() : "");
        
        sql.append(", address_line1 = :addressLine1");
        params.put("addressLine1", request.getAddressLine1() != null ? request.getAddressLine1() : "");
        
        sql.append(", city = :city");
        params.put("city", request.getCity() != null ? request.getCity() : "");
        
        sql.append(", state = :state");
        params.put("state", request.getState() != null ? request.getState() : "");
        
        sql.append(", country = :country");
        params.put("country", request.getCountry() != null ? request.getCountry() : "");
        
        sql.append(", pin_code = :pinCode");
        params.put("pinCode", request.getPinCode() != null ? request.getPinCode() : "");
        
        sql.append(" WHERE user_id = :userId");
        params.put("userId", normalizedUserId);
        
        // Execute update
        var query = entityManager.createNativeQuery(sql.toString());
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }
        
        int updated = query.executeUpdate();
        
        if (updated == 0) {
            return ResponseEntity.status(404).body(new MessageResponse("User not found"));
        }

        // Handle profile image separately if provided
        if (StringUtils.hasText(request.getProfileImage())) {
            String imageToSave = request.getProfileImage();
            if (imageToSave.startsWith("data:image")) {
                String savedPath = saveBase64Image(imageToSave, "profile", normalizedUserId);
                if (StringUtils.hasText(savedPath)) {
                    entityManager.createNativeQuery("UPDATE users SET profile_image = :img WHERE user_id = :uid")
                        .setParameter("img", savedPath)
                        .setParameter("uid", normalizedUserId)
                        .executeUpdate();
                }
            } else if (imageToSave.startsWith("/uploads/") || imageToSave.startsWith("http")) {
                entityManager.createNativeQuery("UPDATE users SET profile_image = :img WHERE user_id = :uid")
                    .setParameter("img", imageToSave)
                    .setParameter("uid", normalizedUserId)
                    .executeUpdate();
            }
        }

        entityManager.flush();
        return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
    } catch (Exception e) {
        System.out.println("ERROR: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(500).body(new MessageResponse("Server error: " + e.getMessage()));
    }
}
