package com.ananta.admin.repository;

import com.ananta.admin.model.DailyRecharge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyRechargeRepository extends JpaRepository<DailyRecharge, Long> {
    List<DailyRecharge> findByUserId(String userId);
    List<DailyRecharge> findByStatus(DailyRecharge.RechargeStatus status);
    List<DailyRecharge> findAllByOrderByCreatedAtDesc();
}
