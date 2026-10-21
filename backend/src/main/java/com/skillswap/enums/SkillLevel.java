package com.skillswap.enums;

public enum SkillLevel {
    Beginner,
    Intermediate,
    Advanced,
    Mastery;

    public static SkillLevel fromString(String value) {
        if (value == null) return Intermediate;
        for (SkillLevel level : SkillLevel.values()) {
            if (level.name().equalsIgnoreCase(value)) {
                return level;
            }
        }
        return Intermediate;
    }
}
