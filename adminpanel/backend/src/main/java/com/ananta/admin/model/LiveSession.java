package com.ananta.admin.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "live_sessions")
public class LiveSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "host_user_id", nullable = false)
    private String hostUserId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String type; // AUDIO or VIDEO

    @Column(name = "channel_name", nullable = false)
    private String channelName;

    @Column(nullable = false)
    private String status = "LIVE"; // LIVE, ENDED

    @Column(name = "viewer_count")
    private Integer viewerCount = 0;

    @Column(name = "likes")
    private Integer likes = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
