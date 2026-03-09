package com.ananta.admin.repository;

import com.ananta.admin.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByUserId(String userId);
    
    List<WalletTransaction> findTop20ByUserIdOrderByCreatedAtDesc(String userId);

    Optional<WalletTransaction> findFirstByUserIdAndTypeAndAmountOrderByCreatedAtDesc(
            String userId,
            String type,
            Double amount
    );

    @Query(
            value = """
                    select wt.user_id as user_id, sum(wt.amount) as total_coins
                    from wallet_transactions wt
                    where wt.type = :type
                    group by wt.user_id
                    order by total_coins desc
                    limit :limit
                    """,
            nativeQuery = true
    )
    List<Object[]> findTopUsersByType(
            @Param("type") String type,
            @Param("limit") int limit
    );
}
