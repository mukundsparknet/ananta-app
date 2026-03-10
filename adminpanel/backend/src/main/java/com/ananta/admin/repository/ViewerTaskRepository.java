package com.ananta.admin.repository;

import com.ananta.admin.model.ViewerTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViewerTaskRepository extends JpaRepository<ViewerTask, Long> {
    List<ViewerTask> findAllByOrderByIdAsc();
}