package com.skillswap.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "achievements")
public class Achievement {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String icon = "verified";

    @Column(name = "icon_bg_color", length = 100)
    private String iconBgColor = "bg-[#82f5c1] text-[#00714e]";

    @Column(name = "progress_text", length = 50)
    private String progressText = "1/1";

    @Column(name = "fill_percent")
    private Integer fillPercent = 100;

    @Column(name = "level_badge", length = 100)
    private String levelBadge = "Verified";

    public Achievement() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }

    public Achievement(String title, String category, String description, String icon, String iconBgColor, String progressText, Integer fillPercent, String levelBadge) {
        this();
        this.title = title;
        this.category = category;
        this.description = description;
        this.icon = icon;
        this.iconBgColor = iconBgColor;
        this.progressText = progressText;
        this.fillPercent = fillPercent;
        this.levelBadge = levelBadge;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getIconBgColor() { return iconBgColor; }
    public void setIconBgColor(String iconBgColor) { this.iconBgColor = iconBgColor; }

    public String getProgressText() { return progressText; }
    public void setProgressText(String progressText) { this.progressText = progressText; }

    public Integer getFillPercent() { return fillPercent; }
    public void setFillPercent(Integer fillPercent) { this.fillPercent = fillPercent; }

    public String getLevelBadge() { return levelBadge; }
    public void setLevelBadge(String levelBadge) { this.levelBadge = levelBadge; }
}
