package com.cell.platform.config;

import com.cell.platform.domain.task.TaskStatus;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.UriUtils;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PublishedImageInterceptor implements HandlerInterceptor {
    private final TaskJpaRepository tasks;
    private final CropJpaRepository crops;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))) return true;
        String path = UriUtils.decode(request.getRequestURI().substring(request.getContextPath().length()), StandardCharsets.UTF_8);
        String[] parts = path.split("/", 4);
        if (parts.length != 4) { response.sendError(404); return false; }
        List<TaskStatus> visible = List.of(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED);
        long count = parts[2].equals("crops") ? crops.countVisibleImage(parts[3], visible) : tasks.countVisibleImage(parts[3], visible);
        if (count == 0) { response.sendError(404); return false; }
        return true;
    }
}
