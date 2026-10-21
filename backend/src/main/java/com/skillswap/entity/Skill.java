package com.skillswap.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "popular_level", length = 50)
    private String popularLevel = "Intermediate";

    private Integer popularity = 0;

    @Column(name = "students_count")
    private Integer studentsCount = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public Skill() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public Skill(String name, String category, String description, String popularLevel) {
        this();
        this.name = name;
        this.category = category;
        this.description = description;
        this.popularLevel = popularLevel;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPopularLevel() { return popularLevel; }
    public void setPopularLevel(String popularLevel) { this.popularLevel = popularLevel; }

    public Integer getPopularity() { return popularity; }
    public void setPopularity(Integer popularity) { this.popularity = popularity; }

    public Integer getStudentsCount() { return studentsCount; }
    public void setStudentsCount(Integer studentsCount) { this.studentsCount = studentsCount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
