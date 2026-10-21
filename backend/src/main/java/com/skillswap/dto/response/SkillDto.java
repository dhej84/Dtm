package com.skillswap.dto.response;

import java.time.Instant;

public class SkillDto {

    private String id;
    private String name;
    private String category;
    private String description;
    private String popularLevel;
    private Integer popularity;
    private Integer studentsCount;
    private Instant createdAt;

    public SkillDto() {}

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
