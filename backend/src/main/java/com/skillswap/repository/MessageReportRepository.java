package com.skillswap.repository;

import com.skillswap.entity.MessageReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageReportRepository extends JpaRepository<MessageReport, String> {

    List<MessageReport> findByReporterId(String reporterId);

    List<MessageReport> findByReportedUserId(String reportedUserId);
}
