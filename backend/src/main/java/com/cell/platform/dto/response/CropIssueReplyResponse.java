package com.cell.platform.dto.response;

import com.cell.platform.entity.CropIssueReplyEntity;
import java.time.LocalDateTime;

public record CropIssueReplyResponse(Long id, String authorUsername, String authorName,
                                     String authorRole, String message, LocalDateTime createdAt) {
    public static CropIssueReplyResponse from(CropIssueReplyEntity reply) {
        return new CropIssueReplyResponse(reply.getId(), reply.getAuthorUsername(), reply.getAuthorName(),
                reply.getAuthorRole(), reply.getMessage(), reply.getCreatedAt());
    }
}
