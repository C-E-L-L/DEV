package com.cell.platform.util;

import com.cell.platform.domain.crop.Crop;
import com.cell.platform.domain.submission.Submission;
import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.user.User;
import com.cell.platform.entity.CropEntity;
import com.cell.platform.entity.SubmissionEntity;
import com.cell.platform.entity.TaskEntity;
import com.cell.platform.entity.UserEntity;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.util.ArrayList;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class Mapper {

    // ── User ──
    public static User convertToUser(UserEntity entity) {
        return User.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .name(entity.getName())
                .password(entity.getPassword())
                .role(entity.getRole())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static UserEntity convertToUserEntity(User user) {
        return UserEntity.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .password(user.getPassword())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ── Task ──
    public static Task convertToTask(TaskEntity entity) {
        Task task = Task.builder()
                .id(entity.getId())
                .status(entity.getStatus())
                .originalFilename(entity.getOriginalFilename())
                .uploadedFilename(entity.getUploadedFilename())
                .assignmentId(entity.getAssignmentId())
                .title(entity.getTitle())
                .createdAt(entity.getCreatedAt())
                .deadlineAt(entity.getDeadlineAt())
                .crops(new ArrayList<>())
                .build();
        if (entity.getCrops() != null) {
            entity.getCrops().forEach(cropEntity -> {
                Crop crop = convertToCrop(cropEntity);
                task.getCrops().add(crop);
            });
        }
        return task;
    }

    public static TaskEntity convertToTaskEntity(Task task) {
        return TaskEntity.builder()
                .id(task.getId())
                .status(task.getStatus())
                .originalFilename(task.getOriginalFilename())
                .uploadedFilename(task.getUploadedFilename())
                .assignmentId(task.getAssignmentId())
                .title(task.getTitle())
                .createdAt(task.getCreatedAt())
                .deadlineAt(task.getDeadlineAt())
                .build();
    }

    // ── Crop ──
    public static Crop convertToCrop(CropEntity entity) {
        return Crop.builder()
                .id(entity.getId())
                .taskId(entity.getTaskId())
                .originalSmearFilename(entity.getTask() != null ? entity.getTask().getOriginalFilename() : null)
                .cropFilename(entity.getCropFilename())
                .bbox(entity.getBbox())
                .gtLabel(entity.getGtLabel())
                .pseudoLabel(entity.getPseudoLabel())
                .aiBboxConfidence(entity.getAiBboxConfidence())
                .aiClassificationConfidence(entity.getAiClassificationConfidence())
                .finalLabel(entity.getFinalLabel())
                .build();
    }

    public static CropEntity convertToCropEntity(Crop crop) {
        return CropEntity.builder()
                .id(crop.getId())
                .cropFilename(crop.getCropFilename())
                .bbox(crop.getBbox())
            .gtLabel(crop.getGtLabel())
            .pseudoLabel(crop.getPseudoLabel())
            .aiBboxConfidence(crop.getAiBboxConfidence())
            .aiClassificationConfidence(crop.getAiClassificationConfidence())
                .finalLabel(crop.getFinalLabel())
                .build();
    }

    // ── Submission ──
    public static Submission convertToSubmission(SubmissionEntity entity) {
        return Submission.builder()
                .id(entity.getId())
                .cropId(entity.getCrop().getId())
                .studentId(entity.getStudentId())
                .studentLabel(entity.getStudentLabel())
                .submittedAt(entity.getSubmittedAt())
                .build();
    }

    public static SubmissionEntity convertToSubmissionEntity(Submission submission, CropEntity cropEntity) {
        return SubmissionEntity.builder()
                .id(submission.getId())
                .crop(cropEntity)
                .studentId(submission.getStudentId())
                .studentLabel(submission.getStudentLabel())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }
}
