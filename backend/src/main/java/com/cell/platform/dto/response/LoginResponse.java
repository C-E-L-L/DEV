package com.cell.platform.dto.response;

public record LoginResponse(
        String accessToken,
        String tokenType,
        String role,
        String username,
        String name
) {
    public static LoginResponse of(String token, String role, String username, String name) {
        return new LoginResponse(token, "bearer", role, username, name);
    }

    public static LoginResponse of(String token, String role, String username) {
        return of(token, role, username, null);
    }
}
