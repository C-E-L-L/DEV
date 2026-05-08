package com.cell.platform.dto.response;

public record LoginResponse(
        String accessToken,
        String tokenType,
        String role,
        String username
) {
    public static LoginResponse of(String token, String role, String username) {
        return new LoginResponse(token, "bearer", role, username);
    }
}
