package com.skillswap.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "lesson_resources")
public class LessonResource {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 50)
    private String size;

    @Column(name = "resource_type", length = 50)
    private String resourceType = "pdf";

    @Column(columnDefinition = "TEXT")
    private String url;

    public LessonResource() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public LessonResource(String name, String size, String resourceType, String url) {
        this();
        this.name = name;
        this.size = size;
        this.resourceType = resourceType;
        this.url = url;
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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
