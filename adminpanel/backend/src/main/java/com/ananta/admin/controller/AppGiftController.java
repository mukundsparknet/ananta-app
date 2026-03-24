package com.ananta.admin.controller;

import com.ananta.admin.model.Gift;
import com.ananta.admin.model.GiftTransaction;
import com.ananta.admin.model.HostLevel;
import com.ananta.admin.model.User;
import com.ananta.admin.model.ViewerLevel;
import com.ananta.admin.model.Wallet;
import com.ananta.admin.model.WalletTransaction;
import com.ananta.admin.payload.MessageResponse;
import com.ananta.admin.repository.GiftRepository;
import com.ananta.admin.repository.GiftTransactionRepository;
import com.ananta.admin.repository.HostLevelRepository;
import com.ananta.admin.repository.UserRepository;
import com.ananta.admin.repository.ViewerLevelRepository;
import com.ananta.admin.repository.WalletRepository;
import com.ananta.admin.repository.WalletTransactionRepository;
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
@RequestMapping("/api/app/gifts")
public class AppGiftController {

    @Autowired
    private GiftRepository giftRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HostLevelRepository hostLevelRepository;

    @Autowired
    private ViewerLevelRepository viewerLevelRepository;

    @Autowired
    private GiftTransactionRepository giftTransactionRepository;

    @GetMapping
    public ResponseEntity<?> listActiveGifts() {
        List<Gift> gifts = giftRepository.findByActiveTrueOrderByCoinValueAsc();
        return ResponseEntity.ok(gifts);
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendGift(@RequestBody Map<String, Object> payload) {
        Object fromIdObj = payload.get("fromUserId");
        Object toIdObj = payload.get("toUserId");
        Object giftIdObj = payload.get("giftId");
        Object sessionIdObj = payload.get("sessionId");
        Object sessionTypeObj = payload.get("sessionType");

        if (fromIdObj == null || toIdObj == null || giftIdObj == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("fromUserId, toUserId and giftId are required"));
        }

        String fromUserId = fromIdObj.toString();
        String toUserId = toIdObj.toString();
        String sessionId = sessionIdObj != null ? sessionIdObj.toString() : null;
        String sessionType = sessionTypeObj != null ? sessionTypeObj.toString() : null;
        
        if (fromUserId.equals(toUserId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot send gift to same user"));
        }

        Long giftId;
        try {
            giftId = Long.parseLong(giftIdObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid giftId"));
        }

        Gift gift = giftRepository.findById(giftId)
                .orElseThrow(() -> new RuntimeException("Gift not found"));
        if (!gift.isActive() || gift.getCoinValue() == null || gift.getCoinValue() <= 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("Gift is not available"));
        }

        int coinValue = gift.getCoinValue();

        Wallet fromWallet = walletRepository.findByUserId(fromUserId)
                .orElseGet(() -> {
                    Wallet w = new Wallet();
                    w.setUserId(fromUserId);
                    return walletRepository.save(w);
                });
        Wallet toWallet = walletRepository.findByUserId(toUserId)
                .orElseGet(() -> {
                    Wallet w = new Wallet();
                    w.setUserId(toUserId);
                    return walletRepository.save(w);
                });

        double fromBalance = fromWallet.getBalance() != null ? fromWallet.getBalance() : 0.0;
        double toBalance = toWallet.getBalance() != null ? toWallet.getBalance() : 0.0;

        if (fromBalance < coinValue) {
            return ResponseEntity.badRequest().body(new MessageResponse("Insufficient balance"));
        }

        fromWallet.setBalance(fromBalance - coinValue);
        toWallet.setBalance(toBalance + coinValue);
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        recordTransaction(fromUserId, coinValue, false, "GIFT_SENT", "Gift sent: " + gift.getName());
        recordTransaction(toUserId, coinValue, true, "GIFT_RECEIVED", "Gift received: " + gift.getName());

        // Get usernames
        String fromUsername = userRepository.findByUserId(fromUserId)
                .map(User::getUsername)
                .orElse("Unknown");
        String toUsername = userRepository.findByUserId(toUserId)
                .map(User::getUsername)
                .orElse("Unknown");

        // Save gift transaction for history
        GiftTransaction giftTransaction = new GiftTransaction();
        giftTransaction.setGiftId(giftId);
        giftTransaction.setGiftName(gift.getName());
        giftTransaction.setGiftValue(coinValue);
        giftTransaction.setFromUserId(fromUserId);
        giftTransaction.setFromUsername(fromUsername);
        giftTransaction.setToUserId(toUserId);
        giftTransaction.setToUsername(toUsername);
        giftTransaction.setSessionId(sessionId);
        giftTransaction.setSessionType(sessionType);
        giftTransaction.setStatus("COMPLETED");
        giftTransactionRepository.save(giftTransaction);

        // Update viewer level for sender (coins spent)
        userRepository.findByUserId(fromUserId).ifPresent(user -> {
            double newSpent = (user.getTotalCoinsSpent() != null ? user.getTotalCoinsSpent() : 0.0) + coinValue;
            user.setTotalCoinsSpent(newSpent);
            user.setViewerLevel(calculateLevel(newSpent, viewerLevelRepository.findAllByOrderByLevelAsc()));
            userRepository.save(user);
        });

        // Update host level for receiver (coins earned)
        userRepository.findByUserId(toUserId).ifPresent(user -> {
            double newEarned = (user.getTotalCoinsEarned() != null ? user.getTotalCoinsEarned() : 0.0) + coinValue;
            user.setTotalCoinsEarned(newEarned);
            user.setHostLevel(calculateLevel(newEarned, hostLevelRepository.findAllByOrderByLevelAsc()));
            userRepository.save(user);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("fromUserId", fromUserId);
        response.put("toUserId", toUserId);
        response.put("giftId", giftId);
        response.put("giftName", gift.getName());
        response.put("coinValue", coinValue);
        response.put("fromBalance", fromWallet.getBalance());
        response.put("toBalance", toWallet.getBalance());
        return ResponseEntity.ok(response);
    }

    private <T> int calculateLevel(double totalCoins, List<T> levels) {
        int currentLevel = 0;
        double cumulative = 0;
        for (T lvl : levels) {
            int coinsRequired;
            int levelNum;
            if (lvl instanceof HostLevel) {
                coinsRequired = ((HostLevel) lvl).getCoinsRequired();
                levelNum = ((HostLevel) lvl).getLevel();
            } else if (lvl instanceof ViewerLevel) {
                coinsRequired = ((ViewerLevel) lvl).getCoinsRequired();
                levelNum = ((ViewerLevel) lvl).getLevel();
            } else break;
            cumulative += coinsRequired;
            if (totalCoins >= cumulative) currentLevel = levelNum;
            else break;
        }
        return currentLevel;
    }

    private void recordTransaction(String userId, double amount, boolean credit, String type, String note) {
        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(userId);
        tx.setAmount(amount);
        tx.setCredit(credit);
        tx.setType(type);
        tx.setNote(note);
        walletTransactionRepository.save(tx);
    }
}
