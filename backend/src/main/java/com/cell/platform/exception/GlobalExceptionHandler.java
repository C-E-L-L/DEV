package com.cell.platform.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException e) {
        log.warn("ERROR CODE {} : {}", e.getErrorCode(), e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(e.getMessage(), e.getErrorCode().name()));
    }

    @ExceptionHandler(AuthorizationException.class)
    public ResponseEntity<ErrorResponse> handleAuthorization(AuthorizationException e) {
        log.warn("ERROR CODE {} : {}", e.getErrorCode(), e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of(e.getMessage(), e.getErrorCode().name()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        log.warn("ERROR CODE {} : {}", e.getErrorCode(), e.getMessage());
        return ResponseEntity.status(e.getStatusCode())
                .body(ErrorResponse.of(e.getMessage(), e.getErrorCode().name()));
    }

    @ExceptionHandler(InfraStructureException.class)
    public ResponseEntity<ErrorResponse> handleInfraStructure(InfraStructureException e) {
        log.warn("ERROR CODE {} : {}", e.getErrorCode(), e.getMessage());
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.of(e.getMessage(), e.getErrorCode().name()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((a, b) -> a + ", " + b)
                .orElse("유효성 검증에 실패했습니다.");
        log.warn("Validation Error: {}", message);
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(message, ErrorCode.G000.name()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of("요청한 리소스를 찾을 수 없습니다.", ErrorCode.G000.name()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleInternalServerError(Exception e) {
        log.error("Unexpected error: ", e);
        return ResponseEntity.internalServerError()
                .body(ErrorResponse.of(e.getMessage(), ErrorCode.SERVER_ERROR.name()));
    }
}
