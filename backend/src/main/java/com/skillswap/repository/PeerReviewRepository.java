package com.skillswap.repository;

import com.skillswap.entity.PeerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PeerReviewRepository extends JpaRepository<PeerReview, String> {
    List<PeerReview> findByTargetUserIdOrderByCreatedAtDesc(String targetUserId);
}
