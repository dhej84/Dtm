package com.skillswap.repository;

import com.skillswap.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    @Query("SELECT c FROM Conversation c " +
           "WHERE (c.participant1.id = :userId OR c.participant2.id = :userId) " +
           "ORDER BY c.lastMessageAt DESC")
    List<Conversation> findUserConversations(@Param("userId") String userId);

    @Query("SELECT c FROM Conversation c " +
           "WHERE (c.participant1.id = :user1Id AND c.participant2.id = :user2Id) " +
           "   OR (c.participant1.id = :user2Id AND c.participant2.id = :user1Id)")
    Optional<Conversation> findBetweenUsers(@Param("user1Id") String user1Id, @Param("user2Id") String user2Id);
}
