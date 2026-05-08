package com.cell.platform.service;

import com.cell.platform.domain.task.Task;
import com.cell.platform.domain.task.TaskRepository;
import com.cell.platform.dto.response.AiAnalysisResponse;
import com.cell.platform.dto.response.TaskResponse;
import com.cell.platform.dto.response.TaskUploadResponse;
import com.cell.platform.fixture.TaskFixture;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @InjectMocks private TaskService taskService;
    @Mock private TaskRepository taskRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private AiClientService aiClientService;

    @Nested
    class getAllTasks_메서드는 {

        @Test
        void 전체_과제를_반환한다() {
            given(taskRepository.findAllByOrderByIdDesc())
                    .willReturn(List.of(TaskFixture.createDomain()));

            List<TaskResponse> result = taskService.getAllTasks();

            assertThat(result).hasSize(1);
        }

        @Test
        void 과제가_없으면_빈_리스트를_반환한다() {
            given(taskRepository.findAllByOrderByIdDesc()).willReturn(List.of());

            List<TaskResponse> result = taskService.getAllTasks();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    class createTask_메서드는 {

        @Test
        void 파일_업로드와_AI_분석_후_과제를_생성한다() {
            MultipartFile file = mock(MultipartFile.class);
            given(file.getOriginalFilename()).willReturn("blood.jpg");
            given(fileStorageService.saveOriginal(file)).willReturn("orig_abc.jpg");

            AiAnalysisResponse aiResponse = mock(AiAnalysisResponse.class);
            given(aiResponse.getCells()).willReturn(List.of());
            given(aiClientService.analyze(file)).willReturn(aiResponse);

            Task savedTask = TaskFixture.createDomain();
            given(taskRepository.save(any(Task.class))).willReturn(savedTask);

            TaskUploadResponse result = taskService.createTask(file);

            assertThat(result.taskId()).isEqualTo(1L);
        }
    }
}