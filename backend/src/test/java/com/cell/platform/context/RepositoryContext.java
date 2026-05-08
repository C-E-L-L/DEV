package com.cell.platform.context;

import com.cell.platform.infra.crop.CropCoreRepository;
import com.cell.platform.infra.crop.CropJpaRepository;
import com.cell.platform.infra.submission.SubmissionCoreRepository;
import com.cell.platform.infra.submission.SubmissionJpaRepository;
import com.cell.platform.infra.task.TaskCoreRepository;
import com.cell.platform.infra.task.TaskJpaRepository;
import com.cell.platform.infra.user.UserCoreRepository;
import com.cell.platform.infra.user.UserJpaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import({
        UserCoreRepository.class,
        TaskCoreRepository.class,
        CropCoreRepository.class,
        SubmissionCoreRepository.class,
})
public abstract class RepositoryContext {

    @Autowired
    protected UserJpaRepository userJpaRepository;

    @Autowired
    protected TaskJpaRepository taskJpaRepository;

    @Autowired
    protected CropJpaRepository cropJpaRepository;

    @Autowired
    protected SubmissionJpaRepository submissionJpaRepository;
}