package com.cell.platform.exception;

import static org.springframework.http.HttpStatus.NOT_FOUND;

public class NotFoundException extends BusinessException {

    public NotFoundException(String message, ErrorCode errorCode) {
        super(message, NOT_FOUND.value(), errorCode);
    }
}
