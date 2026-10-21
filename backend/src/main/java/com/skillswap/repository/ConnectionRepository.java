package com.skillswap.repository;

import com.skillswap.entity.Connection;
import com.skillswap.enums.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, String> {

    @Query("SELECT c FROM Connection c WHERE c.fromUser.id = :userId OR c.toUser.id = :userId ORDER BY c.createdAt DESC")
    List<Connection> findAllUserConnections(@Param("userId") String userId);

    @Query("SELECT c FROM Connection c WHERE c.toUser.id = :userId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Connection> findPendingReceivedRequests(@Param("userId") String userId, @Param("status") ConnectionStatus status);

    @Query("SELECT c FROM Connection c WHERE (c.fromUser.id = :u1 AND c.toUser.id = :u2) OR (c.fromUser.id = :u2 AND c.toUser.id = :u1)")
    Optional<Connection> findBetweenUsers(@Param("u1") String u1, @Param("u2") String u2);
}
