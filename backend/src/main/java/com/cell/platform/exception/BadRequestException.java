package com.cell.platform.exception;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

public class BadRequestException extends BusinessException {

    public BadRequestException(String message, ErrorCode errorCode) {
        super(message, BAD_REQUEST.value(), errorCode);
    }
}
