package com.skillswap.enums;

public enum ConnectionStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    COMPLETED;

    public static ConnectionStatus fromString(String value) {
        if (value == null) return PENDING;
        for (ConnectionStatus status : ConnectionStatus.values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        return PENDING;
    }
}
