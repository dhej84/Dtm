package com.skillswap.enums;

public enum SkillType {
    TEACH,
    LEARN;

    public static SkillType fromString(String value) {
        if (value == null) return TEACH;
        if ("learn".equalsIgnoreCase(value)) return LEARN;
        return TEACH;
    }
}
