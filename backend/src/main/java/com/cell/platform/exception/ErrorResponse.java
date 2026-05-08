package com.cell.platform.exception;

public record ErrorResponse(
        String message,
        String errorCode
) {
    public static ErrorResponse of(String message, String errorCode) {
        return new ErrorResponse(message, errorCode);
    }
}
