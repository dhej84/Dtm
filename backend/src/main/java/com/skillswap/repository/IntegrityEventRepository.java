package com.skillswap.repository;

import com.skillswap.entity.IntegrityEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntegrityEventRepository extends JpaRepository<IntegrityEventEntity, String> {

    List<IntegrityEventEntity> findByAttemptIdOrderByCreatedAtAsc(String attemptId);
}
