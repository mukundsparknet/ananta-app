package com.ananta.admin.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private String userId;

    @Column(nullable = false)
    private String username;

    @Column
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "full_name")
    private String fullName;

    private String gender;

    private String birthday;

    private String bio;

    @Column(name = "address_line1")
    private String addressLine1;

    private String city;

    private String state;

    private String country;

    @Column(name = "pin_code")
    private String pinCode;

    private String location;

    @Column(name = "profile_image")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    private String profileImage;

    @Column(name = "is_blocked")
    private boolean isBlocked = false;

    @Column(name = "is_banned")
    private boolean isBanned = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
