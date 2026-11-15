import { Link } from 'react-router-dom';
import Icon from '../../components/login/icons';
import { relativeTime } from '../../utils/professorDashboard';

const who = event => (event.studentName ? `${event.studentName}(${event.studentId})` : event.studentId);
const title = event => event.title || `과제 #${event.taskId}`;

function describe(event) {
  const results = `/expert/assignments/${event.taskId}/results`;
  if (event.type === 'SUBMITTED') {
    return { icon: 'send', tone: 'indigo', to: results, text: <><strong>{who(event)}</strong> 학생이 <em>{title(event)}</em> 과제를 제출했습니다.</> };
  }
  if (event.type === 'QUESTION') {
    return {
      icon: 'help', tone: event.answered ? 'slate' : 'amber', to: '/expert/reports', detail: event.detail,
      text: <><strong>{who(event)}</strong> 학생이 질문·신고를 등록했습니다.{event.answered ? ' (답변 완료)' : ''}</>,
    };
  }
  return {
    icon: 'alarm', tone: event.pendingLabels > 0 ? 'amber' : 'slate', to: results,
    text: <><em>{title(event)}</em> 과제가 마감되었습니다.{event.pendingLabels > 0 ? ` 정답 미확정 ${event.pendingLabels}문항이 채점을 기다립니다.` : ''}</>,
  };
}

/** Recent activity rows, shared by the dashboard card and the notification bell. */
export default function ActivityList({ events, limit, unreadSince = null, onNavigate, empty = '최근 활동이 없습니다.' }) {
  const items = limit ? events.slice(0, limit) : events;
  if (!items.length) return <p className="prof-empty prof-empty--compact">{empty}</p>;
  const now = new Date();
  return (
    <ul className="prof-activity">
      {items.map(event => {
        const meta = describe(event);
        const unread = unreadSince !== null && new Date(event.at).getTime() > unreadSince;
        return (
          <li key={event.id}>
            <Link to={meta.to} className="prof-activity__item" onClick={onNavigate}>
              <span className={`prof-activity__icon is-${meta.tone}`}><Icon name={meta.icon} size={14} /></span>
              <span className="prof-activity__body">
                <span className="prof-activity__text">{meta.text}</span>
                {meta.detail && <span className="prof-activity__detail">{meta.detail}</span>}
                <span className="prof-activity__time prof-mono">{relativeTime(event.at, now)}</span>
              </span>
              {unread && <span className="prof-activity__dot" role="img" aria-label="새 알림" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
