package com.skillswap.enums;

public enum MessageStatus {
    SENDING,
    SENT,
    DELIVERED,
    READ;

    public static MessageStatus fromString(String value) {
        if (value == null) return SENT;
        for (MessageStatus status : MessageStatus.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return SENT;
    }
}
