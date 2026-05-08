package com.cell.platform.exception;

public class DuplicateUsernameException extends RuntimeException {

    public DuplicateUsernameException(String username) {
        super("이미 존재하는 아이디입니다: " + username);
    }
}
