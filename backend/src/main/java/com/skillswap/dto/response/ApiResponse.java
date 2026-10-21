package com.skillswap.dto.response;

public class ApiResponse<T> {
    private T data;
    private boolean success;
    private String message;
    private int statusCode;

    public ApiResponse() {}

    public ApiResponse(T data, boolean success, String message, int statusCode) {
        this.data = data;
        this.success = success;
        this.message = message;
        this.statusCode = statusCode;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, true, "Operation successful", 200);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(data, true, message, 200);
    }

    public static <T> ApiResponse<T> error(String message, int statusCode) {
        return new ApiResponse<>(null, false, message, statusCode);
    }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }
}
