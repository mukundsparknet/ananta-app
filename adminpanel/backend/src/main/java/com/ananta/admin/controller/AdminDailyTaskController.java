package com.ananta.admin.controller;

import com.ananta.admin.model.HostTask;
import com.ananta.admin.model.ViewerTask;
import com.ananta.admin.repository.HostTaskRepository;
import com.ananta.admin.repository.ViewerTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(
        origins = {
                "http://localhost:8081",
                "http://localhost:19006",
                "http://localhost:3000"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/admin/daily-tasks")
public class AdminDailyTaskController {

    @Autowired
    private HostTaskRepository hostTaskRepository;

    @Autowired
    private ViewerTaskRepository viewerTaskRepository;

    @GetMapping("/host")
    public ResponseEntity<?> getHostTasks() {
        List<HostTask> tasks = hostTaskRepository.findAllByOrderByIdAsc();
        Map<String, Object> response = new HashMap<>();
        response.put("tasks", tasks);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/host")
    public ResponseEntity<?> createHostTask(@RequestBody HostTask task) {
        task.setId(null);
        HostTask saved = hostTaskRepository.save(task);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/host/{id}")
    public ResponseEntity<?> updateHostTask(@PathVariable Long id, @RequestBody HostTask payload) {
        HostTask existing = hostTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setTriggerEvent(payload.getTriggerEvent());
        existing.setTargetValue(payload.getTargetValue());
        existing.setRewardCoins(payload.getRewardCoins());
        existing.setMinLevel(payload.getMinLevel());
        existing.setMaxLevel(payload.getMaxLevel());
        existing.setActive(payload.getActive());
        HostTask saved = hostTaskRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/host/{id}")
    public ResponseEntity<?> deleteHostTask(@PathVariable Long id) {
        if (!hostTaskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        hostTaskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/viewer")
    public ResponseEntity<?> getViewerTasks() {
        List<ViewerTask> tasks = viewerTaskRepository.findAllByOrderByIdAsc();
        Map<String, Object> response = new HashMap<>();
        response.put("tasks", tasks);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/viewer")
    public ResponseEntity<?> createViewerTask(@RequestBody ViewerTask task) {
        task.setId(null);
        ViewerTask saved = viewerTaskRepository.save(task);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/viewer/{id}")
    public ResponseEntity<?> updateViewerTask(@PathVariable Long id, @RequestBody ViewerTask payload) {
        ViewerTask existing = viewerTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setTriggerEvent(payload.getTriggerEvent());
        existing.setTargetValue(payload.getTargetValue());
        existing.setRewardCoins(payload.getRewardCoins());
        existing.setMinLevel(payload.getMinLevel());
        existing.setMaxLevel(payload.getMaxLevel());
        existing.setActive(payload.getActive());
        ViewerTask saved = viewerTaskRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/viewer/{id}")
    public ResponseEntity<?> deleteViewerTask(@PathVariable Long id) {
        if (!viewerTaskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        viewerTaskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}