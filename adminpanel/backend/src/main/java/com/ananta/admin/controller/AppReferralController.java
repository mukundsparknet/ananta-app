package com.ananta.admin.controller;

import com.ananta.admin.model.ReferralTier;
import com.ananta.admin.model.User;
import com.ananta.admin.model.Wallet;
import com.ananta.admin.model.WalletTransaction;
import com.ananta.admin.repository.ReferralTierRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.WalletRepository;
import com.ananta.admin.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:8081", "http://localhost:19006", "http://localhost:3000", "https://ecofuelglobal.com", "http://admin.anantalive.com", "https://admin.anantalive.com"}, maxAge = 3600)
@RestController
@RequestMapping("/api/app/referral")
public class AppReferralController {

    @Autowired private UserRepository userRepository;
    @Autowired private ReferralTierRepository referralTierRepository;
    @Autowired private WalletRepository walletRepository;
    @Autowired private WalletTransactionRepository walletTransactionRepository;

    // GET invite code + tiers + referral count for a user
    @GetMapping("/info/{userId}")
    public ResponseEntity<?> getReferralInfo(@PathVariable String userId) {
        String uid = userId == null ? "" : userId.trim();
        User user = userRepository.findByUserId(uid).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        // Auto-generate invite code if missing
        if (user.getInviteCode() == null || user.getInviteCode().isBlank()) {
            user.setInviteCode(generateInviteCode(user));
            userRepository.save(user);
        }

        List<ReferralTier> tiers = referralTierRepository.findAll();
        tiers.sort(Comparator.comparing(ReferralTier::getShares));

        int referralCount = user.getReferralCount() != null ? user.getReferralCount() : 0;

        // Build claimed status per tier based on wallet transactions
        List<String> claimedTierKeys = walletTransactionRepository.findByUserId(uid).stream()
                .filter(t -> "REFERRAL_REWARD".equals(t.getType()) && t.getNote() != null)
                .map(WalletTransaction::getNote)
                .collect(Collectors.toList());

        List<Map<String, Object>> tierList = tiers.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("shares", t.getShares());
            m.put("coins", t.getCoins());
            boolean claimed = claimedTierKeys.stream().anyMatch(n -> n.contains("tier_" + t.getShares()));
            m.put("claimed", claimed);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("inviteCode", user.getInviteCode());
        response.put("referralCount", referralCount);
        response.put("tiers", tierList);
        return ResponseEntity.ok(response);
    }

    // POST claim reward for a tier milestone
    @PostMapping("/claim")
    public ResponseEntity<?> claimReward(@RequestBody Map<String, Object> payload) {
        String userId = payload.get("userId") != null ? payload.get("userId").toString().trim() : "";
        int shares = payload.get("shares") != null ? Integer.parseInt(payload.get("shares").toString()) : 0;

        User user = userRepository.findByUserId(userId).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        int referralCount = user.getReferralCount() != null ? user.getReferralCount() : 0;
        if (referralCount < shares) return ResponseEntity.badRequest().body(Map.of("error", "Not enough referrals"));

        ReferralTier tier = referralTierRepository.findAll().stream()
                .filter(t -> t.getShares() == shares).findFirst().orElse(null);
        if (tier == null) return ResponseEntity.badRequest().body(Map.of("error", "Tier not found"));

        String noteKey = "REFERRAL_REWARD tier_" + shares;
        boolean alreadyClaimed = walletTransactionRepository.findByUserId(userId).stream()
                .anyMatch(t -> "REFERRAL_REWARD".equals(t.getType()) && noteKey.equals(t.getNote()));
        if (alreadyClaimed) return ResponseEntity.badRequest().body(Map.of("error", "Already claimed"));

        // Credit wallet
        Wallet wallet = walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet w = new Wallet(); w.setUserId(userId); w.setBalance(0.0); return walletRepository.save(w);
        });
        wallet.setBalance((wallet.getBalance() != null ? wallet.getBalance() : 0.0) + tier.getCoins());
        walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(userId); tx.setAmount((double) tier.getCoins());
        tx.setCredit(true); tx.setType("REFERRAL_REWARD"); tx.setNote(noteKey);
        walletTransactionRepository.save(tx);

        return ResponseEntity.ok(Map.of("success", true, "coinsAwarded", tier.getCoins(), "newBalance", wallet.getBalance()));
    }

    // POST apply referral code when a new user registers
    @PostMapping("/apply")
    public ResponseEntity<?> applyReferral(@RequestBody Map<String, String> payload) {
        String newUserId = payload.get("userId") != null ? payload.get("userId").trim() : "";
        String inviteCode = payload.get("inviteCode") != null ? payload.get("inviteCode").trim().toUpperCase() : "";

        if (newUserId.isBlank() || inviteCode.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "userId and inviteCode required"));

        User newUser = userRepository.findByUserId(newUserId).orElse(null);
        if (newUser == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        if (newUser.getReferredBy() != null) return ResponseEntity.badRequest().body(Map.of("error", "Already used a referral code"));

        User referrer = userRepository.findByInviteCode(inviteCode).orElse(null);
        if (referrer == null) return ResponseEntity.badRequest().body(Map.of("error", "Invalid invite code"));
        if (referrer.getUserId().equals(newUserId)) return ResponseEntity.badRequest().body(Map.of("error", "Cannot use your own code"));

        // Only save referredBy — count is incremented only when new user's KYC is approved
        newUser.setReferredBy(referrer.getUserId());
        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("success", true, "referrerUserId", referrer.getUserId()));
    }

    private String generateInviteCode(User user) {
        // Use last 6 chars of userId + random suffix for uniqueness
        String base = user.getUserId().replaceAll("[^A-Z0-9]", "");
        base = base.length() >= 6 ? base.substring(base.length() - 6) : base;
        return (base + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 4)).toUpperCase();
    }
}
