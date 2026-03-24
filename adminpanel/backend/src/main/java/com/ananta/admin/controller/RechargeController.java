package com.ananta.admin.controller;

import com.ananta.admin.model.DailyRecharge;
import com.ananta.admin.model.User;
import com.ananta.admin.repository.DailyRechargeRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.WalletRepository;
import com.ananta.admin.repository.WalletTransactionRepository;
import com.ananta.admin.model.Wallet;
import com.ananta.admin.model.WalletTransaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
@RequestMapping("/api/admin/recharges")
public class RechargeController {
    @Autowired
    DailyRechargeRepository rechargeRepository;

    @Autowired
    WalletRepository walletRepository;

    @Autowired
    WalletTransactionRepository walletTransactionRepository;

    @Autowired
    UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllRecharges() {
        List<DailyRecharge> recharges = rechargeRepository.findAllByOrderByCreatedAtDesc();
        
        // Enrich recharges with username
        List<Map<String, Object>> enrichedRecharges = recharges.stream().map(recharge -> {
            Map<String, Object> rechargeMap = new HashMap<>();
            rechargeMap.put("id", recharge.getId());
            rechargeMap.put("userId", recharge.getUserId());
            rechargeMap.put("amount", recharge.getAmount());
            rechargeMap.put("coins", recharge.getCoins());
            rechargeMap.put("planName", recharge.getPlanName());
            rechargeMap.put("status", recharge.getStatus());
            rechargeMap.put("createdAt", recharge.getCreatedAt());
            rechargeMap.put("updatedAt", recharge.getUpdatedAt());
            
            // Fetch username
            try {
                User user = userRepository.findByUserId(recharge.getUserId()).orElse(null);
                if (user != null) {
                    rechargeMap.put("username", user.getUsername());
                } else {
                    rechargeMap.put("username", "Unknown");
                }
            } catch (Exception e) {
                rechargeMap.put("username", "Unknown");
            }
            
            return rechargeMap;
        }).collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("recharges", enrichedRecharges);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> handleRechargeAction(@RequestBody Map<String, String> payload) {
        Long id = Long.parseLong(payload.get("rechargeId"));
        String action = payload.get("action");

        DailyRecharge recharge = rechargeRepository.findById(id).orElseThrow(() -> new RuntimeException("Recharge not found"));
        
        if ("approve".equalsIgnoreCase(action)) {
             if (recharge.getStatus() != DailyRecharge.RechargeStatus.PENDING) {
                  return ResponseEntity.badRequest().body("Recharge already processed");
             }
             recharge.setStatus(DailyRecharge.RechargeStatus.APPROVED);
             rechargeRepository.save(recharge);
             Wallet wallet = walletRepository.findByUserId(recharge.getUserId())
                 .orElseGet(() -> {
                     Wallet newWallet = new Wallet();
                     newWallet.setUserId(recharge.getUserId());
                     return newWallet;
                 });
             double coinsToAdd = recharge.getCoins() != null ? recharge.getCoins() : recharge.getAmount();
             wallet.setBalance(wallet.getBalance() + coinsToAdd);
             walletRepository.save(wallet);

             WalletTransaction tx = new WalletTransaction();
             tx.setUserId(recharge.getUserId());
             tx.setAmount(coinsToAdd);
             tx.setCredit(true);
             tx.setType("RECHARGE");
             tx.setNote("Recharge: " + recharge.getPlanName());
             walletTransactionRepository.save(tx);
        } else if ("reject".equalsIgnoreCase(action)) {
             recharge.setStatus(DailyRecharge.RechargeStatus.REJECTED);
             rechargeRepository.save(recharge);
        }
        
        return ResponseEntity.ok("Recharge processed successfully");
    }
}
