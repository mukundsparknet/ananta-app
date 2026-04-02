package com.ananta.admin.controller;

import com.ananta.admin.model.User;
import com.ananta.admin.model.UserReport;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.UserReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:8081","http://localhost:19006","http://localhost:3000","http://ecofuelglobal.com","https://ecofuelglobal.com", "http://admin.anantalive.com", "https://admin.anantalive.com"}, maxAge = 3600)
@RestController
public class UserReportController {

    @Autowired
    private UserReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    private String resolveUsername(String userId) {
        if (userId == null) return userId;
        return userRepository.findByUserId(userId)
                .map(u -> u.getUsername() != null ? u.getUsername() : userId)
                .orElse(userId);
    }

    // App: submit a report
    @PostMapping("/api/app/report")
    public ResponseEntity<?> submitReport(@RequestBody Map<String, String> body) {
        String reporterId = body.get("reporterId");
        String reportedUserId = body.get("reportedUserId");
        String reason = body.get("reason");

        if (reporterId == null || reportedUserId == null || reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("reporterId, reportedUserId and reason are required"));
        }

        UserReport report = new UserReport();
        report.setReporterId(reporterId);
        report.setReportedUserId(reportedUserId);
        report.setReason(reason.trim());
        reportRepository.save(report);

        return ResponseEntity.ok(new MessageResponse("Report submitted successfully"));
    }

    // App: get reports submitted by a user
    @GetMapping("/api/app/reports/my")
    public List<Map<String, Object>> getMyReports(@RequestParam String reporterId) {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> reporterId.equals(r.getReporterId()))
                .map(r -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", r.getId());
                    map.put("reportedUserId", r.getReportedUserId());
                    map.put("reportedUserName", resolveUsername(r.getReportedUserId()));
                    map.put("reason", r.getReason());
                    map.put("status", r.getStatus());
                    map.put("adminNote", r.getAdminNote());
                    map.put("createdAt", r.getCreatedAt());
                    return map;
                }).collect(Collectors.toList());
    }

    // Admin: get all reports with resolved usernames
    @GetMapping("/api/admin/reports")
    public List<Map<String, Object>> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc().stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("reporterId", r.getReporterId());
            map.put("reporterName", resolveUsername(r.getReporterId()));
            map.put("reportedUserId", r.getReportedUserId());
            map.put("reportedUserName", resolveUsername(r.getReportedUserId()));
            map.put("reason", r.getReason());
            map.put("status", r.getStatus());
            map.put("adminNote", r.getAdminNote());
            map.put("createdAt", r.getCreatedAt());
            map.put("reviewedAt", r.getReviewedAt());
            return map;
        }).collect(Collectors.toList());
    }

    // Admin: update report status / add note
    @PatchMapping("/api/admin/reports/{id}")
    public ResponseEntity<?> updateReport(@PathVariable Long id, @RequestBody Map<String, String> body) {
        UserReport report = reportRepository.findById(id).orElse(null);
        if (report == null) return ResponseEntity.status(404).body(new MessageResponse("Report not found"));

        if (body.containsKey("status")) report.setStatus(body.get("status"));
        if (body.containsKey("adminNote")) report.setAdminNote(body.get("adminNote"));
        report.setReviewedAt(LocalDateTime.now());
        reportRepository.save(report);

        return ResponseEntity.ok(new MessageResponse("Report updated"));
    }
}
