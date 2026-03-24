package com.ananta.admin.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "gift_transactions")
public class GiftTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gift_id", nullable = false)
    private Long giftId;

    @Column(name = "gift_name", nullable = false)
    private String giftName;

    @Column(name = "gift_value", nullable = false)
    private Integer giftValue;

    @Column(name = "from_user_id", nullable = false)
    private String fromUserId;

    @Column(name = "from_username")
    private String fromUsername;

    @Column(name = "to_user_id", nullable = false)
    private String toUserId;

    @Column(name = "to_username")
    private String toUsername;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "session_type")
    private String sessionType; // VIDEO or AUDIO

    @Column(nullable = false)
    private String status = "COMPLETED"; // COMPLETED, FAILED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
