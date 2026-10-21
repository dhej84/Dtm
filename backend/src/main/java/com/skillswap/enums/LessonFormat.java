package com.skillswap.enums;

public enum LessonFormat {
    INTERACTIVE_WORKSHOP("Interactive Workshop"),
    ONE_ON_ONE_TUTORING("1:1 Tutoring"),
    CODE_WALKTHROUGH("Code Walkthrough"),
    PRACTICE_LAB("Practice Lab");

    private final String label;

    LessonFormat(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static LessonFormat fromString(String value) {
        if (value == null) return INTERACTIVE_WORKSHOP;
        for (LessonFormat format : LessonFormat.values()) {
            if (format.name().equalsIgnoreCase(value) || format.label.equalsIgnoreCase(value)) {
                return format;
            }
        }
        return INTERACTIVE_WORKSHOP;
    }
}
