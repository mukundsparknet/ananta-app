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
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@CrossOrigin(
        origins = {
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000",
                "https://ecofuelglobal.com",
                "http://ecofuelglobal.com"
        },
        allowedHeaders = "*",
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

    private static final Map<String, List<Map<String, Object>>> sessionMessages = new ConcurrentHashMap<>();
    private static final Map<String, Set<String>> sessionKickedUsers = new ConcurrentHashMap<>();
    private static final Map<String, Set<String>> sessionViewers = new ConcurrentHashMap<>();

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

        // Deterministic host UID based on userId (never 0)
        int uid = Math.abs(userId.hashCode()) % 1_000_000 + 1;
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
        response.put("hostUserId", userId);
        response.put("hostUid", uid);
        
        // Add host user info
        Optional<User> hostOpt = userRepository.findByUserId(userId);
        hostOpt.ifPresent(user -> {
            response.put("hostUsername", user.getUsername());
            response.put("hostCountry", user.getCountry());
            try {
                response.put("hostProfileImage", user.getProfileImage());
            } catch (Exception ignored) {}
        });
        
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

            // Block check — if host has blocked this viewer, deny join
            if (StringUtils.hasText(session.getHostUserId())) {
                User host = userRepository.findByUserId(session.getHostUserId()).orElse(null);
                if (host != null && host.getBlockedUsers() != null && host.getBlockedUsers().contains(userId)) {
                    return ResponseEntity.status(403).body(Collections.singletonMap("message", "You cannot join this live session"));
                }
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

            // Host UID is deterministic; viewer gets a random UID
            int hostUid = Math.abs(session.getHostUserId().hashCode()) % 1_000_000 + 1;
            int viewerUid = new java.util.Random().nextInt(1_000_000) + 100_000;
            String token = agoraTokenService.buildRtcToken(
                    channelName,
                    viewerUid,
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
            response.put("hostUid", hostUid);
            response.put("viewerCount", session.getViewerCount());
            response.put("isFollowing", isFollowing);
            // Check if kicked from this session
            if (sessionKickedUsers.getOrDefault(sessionId, new HashSet<>()).contains(userId)) {
                return ResponseEntity.status(403).body(Collections.singletonMap("message", "You have been removed from this live session"));
            }
            // Track viewer
            if (StringUtils.hasText(userId)) {
                sessionViewers.computeIfAbsent(sessionId, k -> new java.util.concurrent.CopyOnWriteArraySet<>()).add(userId);
            }
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
    public ResponseEntity<?> listLiveSessions(@RequestParam(required = false) String userId) {
        List<Map<String, Object>> items = new ArrayList<>();
        try {
            List<LiveSession> lives = liveSessionRepository.findAll();
            for (LiveSession session : lives) {
                if (session == null) {
                    continue;
                }
                // Only show actively LIVE sessions
                if (!"LIVE".equalsIgnoreCase(session.getStatus())) {
                    continue;
                }
                // Hide sessions where host has blocked the viewer
                if (StringUtils.hasText(userId) && StringUtils.hasText(session.getHostUserId())) {
                    User host = userRepository.findByUserId(session.getHostUserId()).orElse(null);
                    if (host != null && host.getBlockedUsers() != null && host.getBlockedUsers().contains(userId)) {
                        continue;
                    }
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

        sessionKickedUsers.remove(sessionId);
        sessionViewers.remove(sessionId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Live ended"));
    }

    @PostMapping("/leave")
    @Transactional
    public ResponseEntity<?> leaveLive(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        if (!StringUtils.hasText(sessionId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId is required"));
        }
        try {
            LiveSession session = liveSessionRepository.findBySessionId(sessionId).orElse(null);
            String leavingUserId = asString(payload.get("userId"));
            if (StringUtils.hasText(leavingUserId) && StringUtils.hasText(sessionId)) {
                sessionViewers.getOrDefault(sessionId, new HashSet<>()).remove(leavingUserId);
            }
            if (session != null) {
                int current = session.getViewerCount() != null ? session.getViewerCount() : 0;
                if (current > 0) {
                    session.setViewerCount(current - 1);
                    liveSessionRepository.save(session);
                }
            }
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(Collections.singletonMap("message", "left"));
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

    @GetMapping("/stats/{sessionId}")
    public ResponseEntity<?> getSessionStats(@PathVariable String sessionId) {
        if (!StringUtils.hasText(sessionId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId is required"));
        }

        Optional<LiveSession> sessionOpt = liveSessionRepository.findBySessionId(sessionId);
        if (!sessionOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        LiveSession session = sessionOpt.get();
        Map<String, Object> stats = new HashMap<>();
        stats.put("viewerCount", session.getViewerCount() != null ? session.getViewerCount() : 0);
        stats.put("likes", session.getLikes() != null ? session.getLikes() : 0);
        stats.put("status", session.getStatus());
        return ResponseEntity.ok(stats);
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        String username = asString(payload.get("username"));
        String message = asString(payload.get("message"));
        String avatar = asString(payload.get("avatar"));

        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(message)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId and message are required"));
        }

        Map<String, Object> msg = new HashMap<>();
        msg.put("id", System.currentTimeMillis());
        msg.put("user", username != null ? username : "User");
        msg.put("message", message);
        msg.put("avatar", avatar != null ? avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50");
        msg.put("timestamp", LocalDateTime.now());

        sessionMessages.computeIfAbsent(sessionId, k -> new ArrayList<>()).add(msg);

        List<Map<String, Object>> messages = sessionMessages.get(sessionId);
        if (messages.size() > 50) {
            messages.remove(0);
        }

        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @GetMapping("/messages/{sessionId}")
    public ResponseEntity<?> getMessages(@PathVariable String sessionId) {
        if (!StringUtils.hasText(sessionId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId is required"));
        }

        List<Map<String, Object>> messages = sessionMessages.getOrDefault(sessionId, new ArrayList<>());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/viewers/{sessionId}")
    public ResponseEntity<?> getViewers(@PathVariable String sessionId) {
        Set<String> viewerIds = sessionViewers.getOrDefault(sessionId, new HashSet<>());
        List<Map<String, Object>> viewers = new ArrayList<>();
        for (String vid : viewerIds) {
            Map<String, Object> v = new HashMap<>();
            v.put("userId", vid);
            userRepository.findByUserId(vid).ifPresent(u -> {
                v.put("username", u.getUsername());
                v.put("profileImage", u.getProfileImage());
            });
            viewers.add(v);
        }
        return ResponseEntity.ok(viewers);
    }

    @PostMapping("/kick")
    public ResponseEntity<?> kickViewer(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        String callerId = asString(payload.get("callerUserId"));
        String viewerId = asString(payload.get("viewerUserId"));
        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(viewerId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId and viewerUserId required"));
        }
        LiveSession session = liveSessionRepository.findBySessionId(sessionId).orElse(null);
        if (session == null || !isHostOrRoomAdmin(session, callerId)) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Not authorized"));
        }
        sessionKickedUsers.computeIfAbsent(sessionId, k -> new java.util.concurrent.CopyOnWriteArraySet<>()).add(viewerId);
        sessionViewers.getOrDefault(sessionId, new HashSet<>()).remove(viewerId);
        return ResponseEntity.ok(Collections.singletonMap("message", "kicked"));
    }

    @PostMapping("/ban")
    @Transactional
    public ResponseEntity<?> banViewer(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        String callerId = asString(payload.get("callerUserId"));
        String viewerId = asString(payload.get("viewerUserId"));
        if (!StringUtils.hasText(sessionId) || !StringUtils.hasText(viewerId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId and viewerUserId required"));
        }
        LiveSession session = liveSessionRepository.findBySessionId(sessionId).orElse(null);
        if (session == null || !isHostOrRoomAdmin(session, callerId)) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Not authorized"));
        }
        sessionKickedUsers.computeIfAbsent(sessionId, k -> new java.util.concurrent.CopyOnWriteArraySet<>()).add(viewerId);
        sessionViewers.getOrDefault(sessionId, new HashSet<>()).remove(viewerId);
        // Ban is always against the host's blocked list
        userRepository.findByUserId(session.getHostUserId()).ifPresent(host -> {
            if (host.getBlockedUsers() == null) host.setBlockedUsers(new java.util.ArrayList<>());
            if (!host.getBlockedUsers().contains(viewerId)) {
                host.getBlockedUsers().add(viewerId);
                userRepository.save(host);
            }
        });
        return ResponseEntity.ok(Collections.singletonMap("message", "banned"));
    }

    private boolean isHostOrRoomAdmin(LiveSession session, String callerId) {
        if (!StringUtils.hasText(callerId)) return false;
        if (callerId.equals(session.getHostUserId())) return true;
        User host = userRepository.findByUserId(session.getHostUserId()).orElse(null);
        return host != null && host.getRoomAdmins() != null && host.getRoomAdmins().contains(callerId);
    }

    @GetMapping("/check-kicked/{sessionId}/{userId}")
    public ResponseEntity<?> checkKicked(@PathVariable String sessionId, @PathVariable String userId) {
        boolean kicked = sessionKickedUsers.getOrDefault(sessionId, new HashSet<>()).contains(userId);
        return ResponseEntity.ok(Collections.singletonMap("kicked", kicked));
    }

    @PostMapping("/like")
    @Transactional
    public ResponseEntity<?> likeSession(@RequestBody Map<String, Object> payload) {
        String sessionId = asString(payload.get("sessionId"));
        if (!StringUtils.hasText(sessionId)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "sessionId is required"));
        }

        try {
            LiveSession session = liveSessionRepository.findBySessionId(sessionId).orElse(null);
            if (session != null) {
                Integer currentLikes = session.getLikes() != null ? session.getLikes() : 0;
                session.setLikes(currentLikes + 1);
                liveSessionRepository.save(session);
                return ResponseEntity.ok(Collections.singletonMap("likes", session.getLikes()));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}
