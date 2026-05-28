package com.cell.platform.dto.response;

import com.cell.platform.entity.StudentRosterEntity;

import java.time.LocalDateTime;

public record StudentRosterResponse(
        Long id,
        String studentId,
        String registeredBy,
        Long claimedUserId,
        LocalDateTime createdAt
) {
    public static StudentRosterResponse from(StudentRosterEntity roster) {
        return new StudentRosterResponse(
                roster.getId(),
                roster.getStudentId(),
                roster.getRegisteredBy(),
                roster.getClaimedUserId(),
                roster.getCreatedAt()
        );
    }
}
