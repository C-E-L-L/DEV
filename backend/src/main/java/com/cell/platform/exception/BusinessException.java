package com.cell.platform.exception;

public class BusinessException extends RuntimeException {

    private final int statusCode;
    private final ErrorCode errorCode;

    public BusinessException(String message, int statusCode, ErrorCode errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
