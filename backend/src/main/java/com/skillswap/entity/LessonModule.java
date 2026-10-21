package com.skillswap.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "lesson_modules")
public class LessonModule {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 50)
    private String duration;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "content_snippet", columnDefinition = "TEXT")
    private String contentSnippet;

    public LessonModule() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public LessonModule(String title, String duration, Integer sequenceOrder, String description, String contentSnippet) {
        this();
        this.title = title;
        this.duration = duration;
        this.sequenceOrder = sequenceOrder;
        this.description = description;
        this.contentSnippet = contentSnippet;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Integer getSequenceOrder() { return sequenceOrder; }
    public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContentSnippet() { return contentSnippet; }
    public void setContentSnippet(String contentSnippet) { this.contentSnippet = contentSnippet; }
}
