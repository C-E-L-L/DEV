package com.cell.platform.exception;

public class AuthorizationException extends CustomException {

    public AuthorizationException(String message, ErrorCode errorCode) {
        super(message, errorCode);
    }
}
