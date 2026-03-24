package com.ananta.admin.controller;

import com.ananta.admin.model.GiftTransaction;
import com.ananta.admin.repository.GiftTransactionRepository;
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
@RequestMapping("/api/admin/gift-history")
public class AdminGiftHistoryController {

    @Autowired
    private GiftTransactionRepository giftTransactionRepository;

    @GetMapping
    public ResponseEntity<?> getAllGiftTransactions() {
        List<GiftTransaction> transactions = giftTransactionRepository.findAllByOrderByCreatedAtDesc();
        
        Map<String, Object> response = new HashMap<>();
        response.put("transactions", transactions);
        return ResponseEntity.ok(response);
    }
}
