package com.ananta.admin.repository;

import com.ananta.admin.model.HostTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HostTaskRepository extends JpaRepository<HostTask, Long> {
    List<HostTask> findAllByOrderByIdAsc();
}