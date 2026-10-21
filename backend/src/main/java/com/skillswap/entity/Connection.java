package com.skillswap.entity;

import com.skillswap.enums.ConnectionStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "connections", uniqueConstraints = {
    @UniqueConstraint(name = "uq_connection_pair", columnNames = {"from_user_id", "to_user_id"})
})
public class Connection {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @Column(name = "teach_skill", length = 150)
    private String teachSkill;

    @Column(name = "learn_skill", length = 150)
    private String learnSkill;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ConnectionStatus status = ConnectionStatus.PENDING;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Connection() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public Connection(User fromUser, User toUser, String teachSkill, String learnSkill, String message) {
        this();
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.teachSkill = teachSkill;
        this.learnSkill = learnSkill;
        this.message = message;
        this.status = ConnectionStatus.PENDING;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getFromUser() { return fromUser; }
    public void setFromUser(User fromUser) { this.fromUser = fromUser; }

    public User getToUser() { return toUser; }
    public void setToUser(User toUser) { this.toUser = toUser; }

    public String getTeachSkill() { return teachSkill; }
    public void setTeachSkill(String teachSkill) { this.teachSkill = teachSkill; }

    public String getLearnSkill() { return learnSkill; }
    public void setLearnSkill(String learnSkill) { this.learnSkill = learnSkill; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public ConnectionStatus getStatus() { return status; }
    public void setStatus(ConnectionStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
