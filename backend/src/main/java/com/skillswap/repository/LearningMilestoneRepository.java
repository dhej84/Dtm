package com.skillswap.repository;

import com.skillswap.entity.LearningMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningMilestoneRepository extends JpaRepository<LearningMilestone, String> {
    List<LearningMilestone> findByUserIdOrderByCreatedAtDesc(String userId);
}
