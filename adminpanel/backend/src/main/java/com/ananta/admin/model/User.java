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

    @Column(name = "cover_image")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARCHAR)
    private String coverImage;

    @Column(name = "is_blocked")
    private boolean isBlocked = false;

    @Column(name = "is_banned")
    private boolean isBanned = false;

    @Column(name = "ban_until")
    private LocalDateTime banUntil;

    @Column(name = "ban_reason")
    private String banReason;

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Column(name = "referral_count")
    private Integer referralCount = 0;

    @Column(name = "referred_by")
    private String referredBy;

    @Column(name = "host_level")
    private Integer hostLevel = 0;

    @Column(name = "viewer_level")
    private Integer viewerLevel = 0;

    @Column(name = "total_coins_earned")
    private Double totalCoinsEarned = 0.0;

    @Column(name = "total_coins_spent")
    private Double totalCoinsSpent = 0.0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public Integer getReferralCount() { return referralCount; }
    public void setReferralCount(Integer referralCount) { this.referralCount = referralCount; }

    public String getReferredBy() { return referredBy; }
    public void setReferredBy(String referredBy) { this.referredBy = referredBy; }

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
