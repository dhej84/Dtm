package com.skillswap.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AddCommentRequest {

    @NotBlank(message = "Comment text cannot be empty")
    @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
    private String text;

    public AddCommentRequest() {}

    public AddCommentRequest(String text) {
        this.text = text;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
