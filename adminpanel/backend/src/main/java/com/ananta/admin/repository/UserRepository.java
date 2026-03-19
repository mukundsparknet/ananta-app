package com.ananta.admin.repository;

import com.ananta.admin.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserId(String userId);
    @Query("select u from User u where trim(u.userId) = :userId")
    Optional<User> findByUserIdTrimmed(@Param("userId") String userId);
    @Query(value = "select * from users where upper(regexp_replace(user_id, '[^A-Za-z0-9]', '', 'g')) = upper(:userId)", nativeQuery = true)
    Optional<User> findByUserIdNormalized(@Param("userId") String userId);
    @Query(value = "select * from users where upper(regexp_replace(user_id, '[^A-Za-z0-9]', '', 'g')) like '%' || upper(:userId) || '%' limit 1", nativeQuery = true)
    Optional<User> findFirstByUserIdLikeNormalized(@Param("userId") String userId);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByInviteCode(String inviteCode);
    @Query(value = "select * from users where lower(username) like lower(concat('%', :q, '%')) or lower(full_name) like lower(concat('%', :q, '%')) or lower(user_id) like lower(concat('%', :q, '%')) limit 20", nativeQuery = true)
    java.util.List<User> searchByQuery(@Param("q") String q);
}
