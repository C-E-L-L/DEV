package com.cell.platform.dto.response;

public record RegisterResponse(
        String status,
        String message
) {
    public static RegisterResponse active() {
        return new RegisterResponse("ACTIVE", "회원가입이 완료되었습니다. 로그인할 수 있습니다.");
    }

    public static RegisterResponse pending() {
        return new RegisterResponse("PENDING", "등록되지 않은 학번입니다. 관리자 승인 후 로그인할 수 있습니다.");
    }
}
