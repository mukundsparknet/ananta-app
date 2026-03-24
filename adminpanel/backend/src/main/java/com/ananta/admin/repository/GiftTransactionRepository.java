package com.ananta.admin.repository;

import com.ananta.admin.model.GiftTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GiftTransactionRepository extends JpaRepository<GiftTransaction, Long> {
    List<GiftTransaction> findAllByOrderByCreatedAtDesc();
    List<GiftTransaction> findByFromUserIdOrderByCreatedAtDesc(String fromUserId);
    List<GiftTransaction> findByToUserIdOrderByCreatedAtDesc(String toUserId);
}
