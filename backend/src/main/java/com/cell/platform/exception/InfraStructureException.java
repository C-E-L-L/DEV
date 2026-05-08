package com.cell.platform.exception;

public class InfraStructureException extends CustomException {

    public InfraStructureException(String message, ErrorCode errorCode) {
        super(message, errorCode);
    }
}
