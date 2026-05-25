package com.cell.platform.domain.user;

import com.cell.platform.exception.BadRequestException;
import com.cell.platform.exception.ErrorCode;
import java.util.Arrays;

public enum Role {
    STUDENT, EXPERT, ADMIN;

    public static Role find(String userRole) {
        return Arrays.stream(values())
                .filter(role -> role.name().equalsIgnoreCase(userRole))
                .findAny()
                .orElseThrow(() -> new BadRequestException(
                        "유효하지 않은 역할입니다. userRole=" + userRole, ErrorCode.U003));
    }
}
