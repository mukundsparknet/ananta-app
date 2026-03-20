package com.ananta.admin.controller;

import com.ananta.admin.model.ChatMessage;
import com.ananta.admin.model.ChatThread;
import com.ananta.admin.model.KYC;
import com.ananta.admin.model.User;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.repository.ChatMessageRepository;
import com.ananta.admin.repository.ChatThreadRepository;
import com.ananta.admin.repository.KYCRepository;
import com.ananta.admin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
@RequestMapping("/api/app/messages")
public class AppMessageController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatThreadRepository chatThreadRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private KYCRepository kycRepository;

    @GetMapping("/threads/{userId}")
    public ResponseEntity<?> listThreads(@PathVariable String userId) {
        try {
            List<ChatThread> threads = chatThreadRepository.findByUserAIdOrUserBIdOrderByLastMessageTimeDesc(userId, userId);
            List<Map<String, Object>> items = new ArrayList<>();

            for (ChatThread thread : threads) {
                if (thread == null) {
                    continue;
                }
                Map<String, Object> m = new HashMap<>();
                m.put("threadId", thread.getThreadId());

                String otherUserId = userId.equals(thread.getUserAId()) ? thread.getUserBId() : thread.getUserAId();
                if (!StringUtils.hasText(otherUserId)) {
                    continue;
                }
                m.put("otherUserId", otherUserId);

                String username = null;
                String fullName = null;
                String profileImage = null;
                try {
                    Optional<User> otherUserOpt = userRepository.findByUserId(otherUserId);
                    if (otherUserOpt.isPresent()) {
                        User u = otherUserOpt.get();
                        username = u.getUsername();
                        fullName = u.getFullName();
                        profileImage = u.getProfileImage();
                    }
                } catch (Exception ignored) {
                }
                if (!StringUtils.hasText(username) && !StringUtils.hasText(fullName)) {
                    try {
                        KYC kyc = kycRepository.findByUserId(otherUserId).orElse(null);
                        if (kyc == null) {
                            kyc = kycRepository.findByUserIdTrimmed(otherUserId).orElse(null);
                        }
                        if (kyc != null && StringUtils.hasText(kyc.getFullName())) {
                            fullName = kyc.getFullName();
                            username = kyc.getFullName();
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

                m.put("lastMessage", thread.getLastMessageText());
                m.put("lastMessageTime", thread.getLastMessageTime());

                Integer unread = userId.equals(thread.getUserAId()) ? thread.getUnreadCountA() : thread.getUnreadCountB();
                if (unread == null) {
                    unread = 0;
                }
                m.put("unreadCount", unread);

                long totalMessages = 0L;
                try {
                    totalMessages = chatMessageRepository.countByThreadId(thread.getThreadId());
                } catch (Exception ignored) {
                }
                m.put("totalMessages", totalMessages);

                items.add(m);
            }

            return ResponseEntity.ok(items);
        } catch (Exception ex) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/thread-by-users")
    public ResponseEntity<?> getThreadByUsers(
            @RequestParam("userA") String userA,
            @RequestParam("userB") String userB
    ) {
        if (!StringUtils.hasText(userA) || !StringUtils.hasText(userB) || userA.equals(userB)) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "userA and userB are required and must be different"));
        }
        Optional<ChatThread> existing = chatThreadRepository.findByUserAIdAndUserBIdOrUserBIdAndUserAId(
                userA, userB, userA, userB
        );
        if (existing.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyMap());
        }
        ChatThread thread = existing.get();
        Map<String, Object> resp = new HashMap<>();
        resp.put("threadId", thread.getThreadId());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/thread/{threadId}")
    public ResponseEntity<?> getThreadMessages(
            @PathVariable String threadId,
            @RequestParam(name = "userId", required = false) String userId
    ) {
        try {
            Optional<ChatThread> threadOpt = chatThreadRepository.findByThreadId(threadId);
            if (threadOpt.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            ChatThread thread = threadOpt.get();

            List<ChatMessage> messages = new ArrayList<>();
            try {
                messages = chatMessageRepository.findByThreadIdOrderByCreatedAtAsc(threadId);
            } catch (Exception ignored) {
            }

            if (StringUtils.hasText(userId)) {
                try {
                    boolean isParticipant = userId.equals(thread.getUserAId()) || userId.equals(thread.getUserBId());
                    if (isParticipant) {
                        List<ChatMessage> unreadMessages = chatMessageRepository.findByThreadIdAndReceiverIdAndStatusNot(
                                threadId,
                                userId,
                                "READ"
                        );
                        LocalDateTime now = LocalDateTime.now();
                        for (ChatMessage message : unreadMessages) {
                            message.setStatus("READ");
                            message.setReadAt(now);
                        }
                        if (!unreadMessages.isEmpty()) {
                            chatMessageRepository.saveAll(unreadMessages);
                            if (userId.equals(thread.getUserAId())) {
                                thread.setUnreadCountA(0);
                            } else {
                                thread.setUnreadCountB(0);
                            }
                            chatThreadRepository.save(thread);
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            List<Map<String, Object>> items = new ArrayList<>();
            for (ChatMessage msg : messages) {
                if (msg == null) {
                    continue;
                }
                Map<String, Object> m = new HashMap<>();
                m.put("id", msg.getId());
                m.put("threadId", msg.getThreadId());
                m.put("senderId", msg.getSenderId());
                m.put("receiverId", msg.getReceiverId());
                m.put("content", msg.getContent());
                m.put("status", msg.getStatus());
                m.put("createdAt", msg.getCreatedAt());
                m.put("deleted", false);
                items.add(m);
            }

            return ResponseEntity.ok(items);
        } catch (Exception ex) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> payload) {
        String senderId = payload.get("senderId");
        String receiverId = payload.get("receiverId");
        String content = payload.get("content");
        String threadId = payload.get("threadId");

        if (!StringUtils.hasText(senderId) || !StringUtils.hasText(receiverId) || !StringUtils.hasText(content)) {
            return ResponseEntity.badRequest().body(new MessageResponse("senderId, receiverId and content are required"));
        }
        if (senderId.equals(receiverId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("User cannot send message to themselves"));
        }

        // Block check — if receiver has blocked sender, deny
        User receiver = userRepository.findByUserId(receiverId).orElse(null);
        if (receiver != null && receiver.getBlockedUsers() != null && receiver.getBlockedUsers().contains(senderId)) {
            return ResponseEntity.status(403).body(new MessageResponse("You cannot send a message to this user"));
        }
        // Also check if sender has blocked receiver
        User sender = userRepository.findByUserId(senderId).orElse(null);
        if (sender != null && sender.getBlockedUsers() != null && sender.getBlockedUsers().contains(receiverId)) {
            return ResponseEntity.status(403).body(new MessageResponse("You have blocked this user"));
        }

        ChatThread thread;
        if (StringUtils.hasText(threadId)) {
            thread = chatThreadRepository.findByThreadId(threadId)
                    .orElseThrow(() -> new RuntimeException("Thread not found"));
        } else {
            Optional<ChatThread> existing = chatThreadRepository.findByUserAIdAndUserBIdOrUserBIdAndUserAId(
                    senderId, receiverId, senderId, receiverId
            );
            if (existing.isPresent()) {
                thread = existing.get();
            } else {
                thread = new ChatThread();
                thread.setThreadId(UUID.randomUUID().toString());
                thread.setUserAId(senderId);
                thread.setUserBId(receiverId);
            }
        }

        ChatMessage message = new ChatMessage();
        message.setThreadId(thread.getThreadId());
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message.setStatus("SENT");

        ChatMessage saved = chatMessageRepository.save(message);

        thread.setLastMessageText(content);
        thread.setLastMessageTime(saved.getCreatedAt());
        thread.setLastMessageSenderId(senderId);

        Integer unreadA = thread.getUnreadCountA();
        Integer unreadB = thread.getUnreadCountB();
        if (unreadA == null) {
            unreadA = 0;
        }
        if (unreadB == null) {
            unreadB = 0;
        }
        if (senderId.equals(thread.getUserAId())) {
            thread.setUnreadCountB(unreadB + 1);
        } else if (senderId.equals(thread.getUserBId())) {
            thread.setUnreadCountA(unreadA + 1);
        }

        chatThreadRepository.save(thread);

        Map<String, Object> response = new HashMap<>();
        response.put("threadId", thread.getThreadId());
        response.put("messageId", saved.getId());
        response.put("status", saved.getStatus());
        response.put("createdAt", saved.getCreatedAt());
        response.put("content", saved.getContent());
        response.put("senderId", saved.getSenderId());
        response.put("receiverId", saved.getReceiverId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/read")
    public ResponseEntity<?> markThreadRead(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String threadId = payload.get("threadId");

        if (!StringUtils.hasText(userId) || !StringUtils.hasText(threadId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("userId and threadId are required"));
        }

        ChatThread thread = chatThreadRepository.findByThreadId(threadId)
                .orElseThrow(() -> new RuntimeException("Thread not found"));

        List<ChatMessage> unreadMessages = chatMessageRepository.findByThreadIdAndReceiverIdAndStatusNot(
                threadId,
                userId,
                "READ"
        );
        LocalDateTime now = LocalDateTime.now();
        for (ChatMessage message : unreadMessages) {
            message.setStatus("READ");
            message.setReadAt(now);
        }
        if (!unreadMessages.isEmpty()) {
            chatMessageRepository.saveAll(unreadMessages);
            if (userId.equals(thread.getUserAId())) {
                thread.setUnreadCountA(0);
            } else if (userId.equals(thread.getUserBId())) {
                thread.setUnreadCountB(0);
            }
            chatThreadRepository.save(thread);
        }

        return ResponseEntity.ok(Collections.singletonMap("updated", unreadMessages.size()));
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteMessage(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String messageIdStr = payload.get("messageId");

        if (!StringUtils.hasText(userId) || !StringUtils.hasText(messageIdStr)) {
            return ResponseEntity.badRequest().body(new MessageResponse("userId and messageId are required"));
        }

        long messageId;
        try {
            messageId = Long.parseLong(messageIdStr);
        } catch (NumberFormatException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid messageId"));
        }

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!userId.equals(message.getSenderId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Only sender can delete message"));
        }

        LocalDateTime now = LocalDateTime.now();
        if (message.getCreatedAt() != null) {
            long minutes = ChronoUnit.MINUTES.between(message.getCreatedAt(), now);
            if (minutes > 5) {
                return ResponseEntity.badRequest().body(new MessageResponse("Message can only be deleted within 5 minutes"));
            }
        }

        message.setDeletedAt(now);
        message.setContent("");
        chatMessageRepository.save(message);

        return ResponseEntity.ok(new MessageResponse("Message deleted"));
    }
}
