package com.skillswap.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations", indexes = {
    @Index(name = "idx_conv_p1", columnList = "participant1_id"),
    @Index(name = "idx_conv_p2", columnList = "participant2_id"),
    @Index(name = "idx_conv_last_msg", columnList = "last_message_at")
})
public class Conversation {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant1_id", nullable = false)
    private User participant1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant2_id", nullable = false)
    private User participant2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_lesson_id")
    private Lesson activeLesson;

    @Column(name = "referenced_module_id", length = 50)
    private String referencedModuleId;

    @Column(name = "last_message_content", length = 1000)
    private String lastMessageContent;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "unread_count_user1")
    private Integer unreadCountUser1 = 0;

    @Column(name = "unread_count_user2")
    private Integer unreadCountUser2 = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Conversation() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public Conversation(User participant1, User participant2) {
        this();
        this.participant1 = participant1;
        this.participant2 = participant2;
        this.lastMessageAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.lastMessageAt == null) {
            this.lastMessageAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getParticipant1() { return participant1; }
    public void setParticipant1(User participant1) { this.participant1 = participant1; }

    public User getParticipant2() { return participant2; }
    public void setParticipant2(User participant2) { this.participant2 = participant2; }

    public Lesson getActiveLesson() { return activeLesson; }
    public void setActiveLesson(Lesson activeLesson) { this.activeLesson = activeLesson; }

    public String getReferencedModuleId() { return referencedModuleId; }
    public void setReferencedModuleId(String referencedModuleId) { this.referencedModuleId = referencedModuleId; }

    public String getLastMessageContent() { return lastMessageContent; }
    public void setLastMessageContent(String lastMessageContent) { this.lastMessageContent = lastMessageContent; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public Integer getUnreadCountUser1() { return unreadCountUser1; }
    public void setUnreadCountUser1(Integer unreadCountUser1) { this.unreadCountUser1 = unreadCountUser1; }

    public Integer getUnreadCountUser2() { return unreadCountUser2; }
    public void setUnreadCountUser2(Integer unreadCountUser2) { this.unreadCountUser2 = unreadCountUser2; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
