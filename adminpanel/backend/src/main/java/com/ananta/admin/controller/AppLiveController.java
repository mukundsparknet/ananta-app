package com.ananta.admin.controller;

import com.ananta.admin.model.LiveSession;
import com.ananta.admin.model.User;
import com.ananta.admin.repository.LiveSessionRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.FollowRepository;
import com.ananta.admin.service.AgoraTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(
        origins = {
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/app/live")
public class AppLiveController {

    @Autowired
    private LiveSessionRepository liveSessionRepository;

    @Autowired
    private AgoraTokenService agoraTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowRepository followRepository;

    @PostMapping("/start")
    public ResponseEntity<?> startLive(@RequestBody Map<String, Object> payload) {
        String userId = asString(payload.get("userId"));
        String type = asString(payload.get("type"));
        String title = asString(payload.getOrDefault("title", "Live Session"));

        if (!StringUtils.hasText(userId) || !StringUtils.hasText(type)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "userId and type are required"));
        }

        String normalizedType = type.equalsIgnoreCase("video") ? "VIDEO" : "AUDIO";

        String sessionId = UUID.randomUUID().toString();
        String channelName = "live_" + userId + "_" + System.currentTimeMillis();

        LiveSession session = new LiveSession();
        session.setSessionId(sessionId);
        session.setHostUserId(userId);
        session.setTitle(title);
        session.setType(normalizedType);
        session.setChannelName(channelName);
        session.setStatus("LIVE");
        session.setViewerCount(0);
        session.setCreatedAt(LocalDateTime.now());

        liveSessionRepository.save(session);

        int uid = 0;
        String token = agoraTokenService.buildRtcToken(
                channelName,
                uid,
                AgoraTokenService.RtcRole.PUBLISHER.getValue()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", sessionId);
        response.put("channelName", channelName);
        response.put("token", token);
        response.put("appId", agoraTokenService.getAppId());
        response.put("type", normalizedType);
        response.put("title", title);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    @Transactional
    public ResponseEntity<?> joinLive(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        String userId = asString(payload.get("userId"));

        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(userId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId and userId are required"));
        }

        try {
            LiveSession session = liveSessionRepository.findBySessionId(sessionId)
                    .orElseThrow(() -> new RuntimeException("Live session not found"));

            if (!"LIVE".equalsIgnoreCase(session.getStatus())) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Live session is not active"));
            }

            Integer currentCount = session.getViewerCount();
            if (currentCount == null) {
                currentCount = 0;
            }
            session.setViewerCount(currentCount + 1);
            liveSessionRepository.save(session);

            String hostUserId = session.getHostUserId();
            String channelName = session.getChannelName();
            if (!StringUtils.hasText(channelName)) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Channel name is missing"));
            }

            int uid = 0;
            String token = agoraTokenService.buildRtcToken(
                    channelName,
                    uid,
                    AgoraTokenService.RtcRole.SUBSCRIBER.getValue()
            );

            Optional<User> hostOpt = Optional.empty();
            boolean isFollowing = false;
            if (StringUtils.hasText(hostUserId)) {
                hostOpt = userRepository.findByUserId(hostUserId);
                try {
                    isFollowing = followRepository.existsByFollowerIdAndFolloweeId(userId, hostUserId);
                } catch (Exception ignored) {
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getSessionId());
            response.put("channelName", session.getChannelName());
            response.put("token", token);
            response.put("appId", agoraTokenService.getAppId());
            response.put("type", session.getType());
            response.put("title", session.getTitle());
            response.put("hostUserId", hostUserId);
            response.put("viewerCount", session.getViewerCount());
            response.put("isFollowing", isFollowing);
            hostOpt.ifPresent(user -> {
                response.put("hostUsername", user.getUsername());
                response.put("hostCountry", user.getCountry());
                try {
                    response.put("hostProfileImage", user.getProfileImage());
                } catch (Exception ignored) {
                }
            });
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Join failed");
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> listLiveSessions() {
        List<Map<String, Object>> items = new ArrayList<>();
        try {
            List<LiveSession> lives = liveSessionRepository.findAll();
            for (LiveSession session : lives) {
                if (session == null) {
                    continue;
                }
                String status = session.getStatus();
                boolean liveStatus = status != null && "LIVE".equalsIgnoreCase(status.trim());
                if (!(session.getEndedAt() == null || liveStatus)) {
                    continue;
                }
                try {
                    Map<String, Object> m = new HashMap<>();
                    m.put("sessionId", session.getSessionId());
                    m.put("title", session.getTitle());
                    m.put("type", session.getType());
                    m.put("hostUserId", session.getHostUserId());
                    m.put("channelName", session.getChannelName());
                    m.put("createdAt", session.getCreatedAt());
                    m.put("viewerCount", session.getViewerCount());

                    if (StringUtils.hasText(session.getHostUserId())) {
                        Optional<User> userOpt = userRepository.findByUserId(session.getHostUserId());
                        userOpt.ifPresent(user -> {
                            String hashtag = StringUtils.hasText(user.getBio()) ? user.getBio() : session.getTitle();
                            String location = StringUtils.hasText(user.getLocation()) ? user.getLocation() : user.getCountry();
                            m.put("title", hashtag);
                            m.put("username", user.getUsername());
                            m.put("country", location);
                            m.put("location", location);
                            m.put("profileImage", user.getProfileImage());
                        });
                    }
                    items.add(m);
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
        Map<String, Object> response = new HashMap<>();
        response.put("sessions", items);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/end")
    public ResponseEntity<?> endLive(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        String userId = asString(payload.get("userId"));

        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(userId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId and userId are required"));
        }

        LiveSession session = liveSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Live session not found"));

        if (!userId.equals(session.getHostUserId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Only host can end live"));
        }

        session.setStatus("ENDED");
        session.setEndedAt(LocalDateTime.now());
        liveSessionRepository.save(session);

        return ResponseEntity.ok(Collections.singletonMap("message", "Live ended"));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<?> getLiveHistory(@PathVariable String userId) {
        if (!StringUtils.hasText(userId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "userId is required"));
        }

        List<LiveSession> sessions = liveSessionRepository.findByHostUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> items = sessions.stream().map(session -> {
            Map<String, Object> m = new HashMap<>();
            m.put("sessionId", session.getSessionId());
            m.put("title", session.getTitle());
            m.put("type", session.getType());
            m.put("createdAt", session.getCreatedAt());
            m.put("endedAt", session.getEndedAt());
            m.put("status", session.getStatus());
            m.put("viewerCount", session.getViewerCount());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(items);
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }
}
