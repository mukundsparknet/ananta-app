package com.ananta.admin.repository;

import com.ananta.admin.model.MicRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MicRequestRepository extends JpaRepository<MicRequest, Long> {
    
    List<MicRequest> findBySessionIdAndStatus(String sessionId, String status);
    
    List<MicRequest> findBySessionId(String sessionId);
    
    Optional<MicRequest> findBySessionIdAndRequesterUserId(String sessionId, String requesterUserId);
    
    List<MicRequest> findByHostUserIdAndStatus(String hostUserId, String status);
    
    void deleteBySessionId(String sessionId);
}