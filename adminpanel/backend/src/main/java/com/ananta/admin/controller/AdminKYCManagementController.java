package com.ananta.admin.controller;

import com.ananta.admin.model.KYC;
import com.ananta.admin.model.ReferralTier;
import com.ananta.admin.model.User;
import com.ananta.admin.model.Wallet;
import com.ananta.admin.model.WalletTransaction;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.repository.KYCRepository;
import com.ananta.admin.repository.ReferralTierRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.WalletRepository;
import com.ananta.admin.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
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
@RequestMapping("/api/admin/kyc")
public class AdminKYCManagementController {

    @Autowired
    private KYCRepository kycRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReferralTierRepository referralTierRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @GetMapping
    public Map<String, Object> getKycRequests() {
        List<KYC> list = kycRepository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("kycRequests", list);
        return response;
    }

    @PostMapping
    public ResponseEntity<?> handleKycAction(@RequestBody Map<String, String> payload) {
        String kycIdStr = payload.get("kycId");
        String action = payload.get("action");
        if (kycIdStr == null || action == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("kycId and action are required"));
        }

        Long kycId = Long.parseLong(kycIdStr);
        KYC kyc = kycRepository.findById(kycId)
                .orElseThrow(() -> new RuntimeException("KYC not found"));

        if ("approve".equalsIgnoreCase(action)) {
            kyc.setStatus(KYC.KYCStatus.APPROVED);
            kycRepository.save(kyc);
            giveReferralBonusOnKycApproval(kyc.getUserId());
            return ResponseEntity.ok(new MessageResponse("KYC updated successfully"));
        } else if ("reject".equalsIgnoreCase(action)) {
            kyc.setStatus(KYC.KYCStatus.REJECTED);
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid action"));
        }

        kycRepository.save(kyc);
        return ResponseEntity.ok(new MessageResponse("KYC updated successfully"));
    }

    private void giveReferralBonusOnKycApproval(String newUserId) {
        try {
            User newUser = userRepository.findByUserId(newUserId).orElse(null);
            if (newUser == null || newUser.getReferredBy() == null) return;

            String referrerId = newUser.getReferredBy();
            User referrer = userRepository.findByUserId(referrerId).orElse(null);
            if (referrer == null) return;

            // Increment referrer's count
            int count = referrer.getReferralCount() != null ? referrer.getReferralCount() : 0;
            count++;
            referrer.setReferralCount(count);
            userRepository.save(referrer);

            // Find matching tier for this count
            List<ReferralTier> tiers = referralTierRepository.findAll();
            tiers.sort(Comparator.comparing(ReferralTier::getShares));

            for (ReferralTier tier : tiers) {
                if (tier.getShares() == count) {
                    String noteKey = "REFERRAL_REWARD tier_" + tier.getShares();
                    boolean alreadyClaimed = walletTransactionRepository.findByUserId(referrerId).stream()
                            .anyMatch(t -> "REFERRAL_REWARD".equals(t.getType()) && noteKey.equals(t.getNote()));
                    if (alreadyClaimed) break;

                    Wallet wallet = walletRepository.findByUserId(referrerId).orElseGet(() -> {
                        Wallet w = new Wallet(); w.setUserId(referrerId); w.setBalance(0.0);
                        return walletRepository.save(w);
                    });
                    wallet.setBalance((wallet.getBalance() != null ? wallet.getBalance() : 0.0) + tier.getCoins());
                    walletRepository.save(wallet);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(referrerId); tx.setAmount((double) tier.getCoins());
                    tx.setCredit(true); tx.setType("REFERRAL_REWARD"); tx.setNote(noteKey);
                    walletTransactionRepository.save(tx);
                    break;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to give referral bonus: " + e.getMessage());
        }
    }
}
