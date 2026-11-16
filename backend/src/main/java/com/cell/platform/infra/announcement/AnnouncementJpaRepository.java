package com.cell.platform.infra.announcement;
import com.cell.platform.entity.AnnouncementEntity;
import com.cell.platform.entity.AnnouncementEntity.Audience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AnnouncementJpaRepository extends JpaRepository<AnnouncementEntity, Long> {
    List<AnnouncementEntity> findAllByOrderByUrgentDescCreatedAtDescIdDesc();
    List<AnnouncementEntity> findAllByAudienceInOrderByUrgentDescCreatedAtDescIdDesc(List<Audience> audiences);
    List<AnnouncementEntity> findAllByAudienceInOrAuthorOrderByUrgentDescCreatedAtDescIdDesc(List<Audience> audiences, String author);
}
