package com.skillswap.repository;

import com.skillswap.entity.Message;
import com.skillswap.enums.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    Page<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);

    @Modifying
    @Query("UPDATE Message m SET m.status = :newStatus " +
           "WHERE m.conversation.id = :conversationId " +
           "  AND m.sender.id <> :viewerId " +
           "  AND m.status <> 'READ'")
    int markConversationMessagesAsRead(@Param("conversationId") String conversationId,
                                      @Param("viewerId") String viewerId,
                                      @Param("newStatus") MessageStatus newStatus);

    @Query("SELECT m FROM Message m " +
           "WHERE (m.conversation.participant1.id = :userId OR m.conversation.participant2.id = :userId) " +
           "  AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY m.createdAt DESC")
    List<Message> searchUserMessages(@Param("userId") String userId, @Param("query") String query);
}
