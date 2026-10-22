package com.nutricart.domain;

import com.nutricart.domain.enums.NotificationType;
import jakarta.persistence.*;
import java.time.Instant;

/** A real event notification (order progress, pantry expiry, budget, plans). */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_user", columnList = "user_id"),
        @Index(name = "idx_notifications_created", columnList = "created_at")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_notifications_user"))
    private UserAccount user;

    @Column(name = "person_profile_id")
    private Long personProfileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type = NotificationType.SYSTEM;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 400)
    private String message;

    @Column(name = "action_path", nullable = false, length = 120)
    private String actionPath = "/overview";

    @Column(name = "is_important", nullable = false)
    private boolean isImportant;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }
    public Long getPersonProfileId() { return personProfileId; }
    public void setPersonProfileId(Long personProfileId) { this.personProfileId = personProfileId; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getActionPath() { return actionPath; }
    public void setActionPath(String actionPath) { this.actionPath = actionPath; }
    public boolean isImportant() { return isImportant; }
    public void setImportant(boolean important) { this.isImportant = important; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { this.isRead = read; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
