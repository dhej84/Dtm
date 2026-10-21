package com.skillswap.enums;

public enum NotificationType {
    SWAP_REQUEST("swap_request"),
    BADGE_EARNED("badge_earned"),
    REVIEW_RECEIVED("review_received"),
    LESSON_UPDATE("lesson_update");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotificationType fromString(String value) {
        if (value == null) return SWAP_REQUEST;
        for (NotificationType t : NotificationType.values()) {
            if (t.name().equalsIgnoreCase(value) || t.value.equalsIgnoreCase(value)) {
                return t;
            }
        }
        return SWAP_REQUEST;
    }
}
