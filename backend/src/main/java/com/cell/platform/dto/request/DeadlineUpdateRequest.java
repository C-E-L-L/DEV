package com.cell.platform.dto.request;

import java.time.LocalDateTime;

public record DeadlineUpdateRequest(
        LocalDateTime deadlineAt
) {
}
