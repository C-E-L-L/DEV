import { Link } from 'react-router-dom';
import Icon from '../../components/login/icons';
import { relativeTime } from '../../utils/professorDashboard';

const KINDS = {
  reply: { icon: 'mail', title: event => `${event.author || '교수'} 교수 답변 등록`, text: event => event.text },
  question: { icon: 'help', title: () => '내 질문 접수', text: event => event.text },
  published: { icon: 'clipboard', title: () => '새 과제 게시', text: event => `${event.title} 과제가 등록되었습니다.` },
  due: { icon: 'alarm', title: () => '마감 임박', text: event => (event.days > 0 ? `${event.title} 마감까지 ${event.days}일 남았습니다.` : `${event.title} 오늘 마감입니다.`) },
  notice: { icon: 'bell', title: event => (event.urgent ? '긴급 공지' : '새 공지사항'), text: event => event.title },
};

function tone(event) {
  if (event.type === 'reply') return ' is-indigo';
  if (event.type === 'due' || (event.type === 'notice' && event.urgent)) return ' stu-activity--due';
  return '';
}

/**
 * Student activity rows (dashboard card and notification bell).
 * `unreadSince`: events after it get a dot; without it, a dot marks replies from the last week.
 */
export default function StudentActivityList({ events, unreadSince, onNavigate }) {
  return (
    <ul className="prof-activity">
      {events.map(event => {
        const kind = KINDS[event.type];
        const dot = unreadSince == null ? event.fresh : new Date(event.at).getTime() > unreadSince;
        return (
          <li key={event.key}>
            <Link to={event.to} className="prof-activity__item" onClick={onNavigate}>
              <span className={`prof-activity__icon${tone(event)}`}><Icon name={kind.icon} size={14} /></span>
              <span className="prof-activity__body">
                <span className={`prof-activity__text stu-activity__title${tone(event)}`}><strong>{kind.title(event)}</strong></span>
                <span className="prof-activity__detail stu-activity__detail">{kind.text(event)}</span>
                <span className="prof-activity__time">{relativeTime(event.at)}</span>
              </span>
              {dot && <span className="prof-activity__dot" title={unreadSince == null ? '최근 7일 이내 답변' : '새 알림'} />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
