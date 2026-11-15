import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/login/icons';
import { notificationFeed, unreadCount } from '../../utils/studentDashboard';
import StudentActivityList from './StudentActivity';
import { courseworkState, useStudentData } from './StudentData';

function readSeen(key) {
  try { return Number(window.localStorage.getItem(key)) || 0; } catch { return 0; }
}
function writeSeen(key, value) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* private mode: unread state lasts for this visit only */ }
}

/**
 * Student notifications: professor replies, new coursework, close deadlines and notices.
 * Like the professor bell, "read" is remembered per browser and account; opening the panel reads everything.
 */
export default function StudentNotificationBell() {
  const { user } = useAuth();
  const { items, progress, reports, announcements } = useStudentData();
  const key = `cell-student-notifications-seen:${user.username}`;
  const [seenAt, setSeenAt] = useState(() => readSeen(key));
  const [open, setOpen] = useState(false);
  const [unreadSince, setUnreadSince] = useState(0);
  const root = useRef(null);

  const events = useMemo(() => {
    // A deadline only counts once the coursework's progress is known (submitted work is not "due").
    const rows = items.map(item => ({ item, state: progress[item.key] ? courseworkState(item, progress[item.key]) : { todo: false } }));
    return notificationFeed({ rows, reports, announcements });
  }, [items, progress, reports, announcements]);
  const unread = unreadCount(events, seenAt);

  const toggle = () => {
    if (!open) {
      setUnreadSince(seenAt); // keep marking what was new while the panel is open
      const newest = events.reduce((latest, event) => Math.max(latest, new Date(event.at).getTime()), 0);
      const next = Math.max(Date.now(), newest);
      setSeenAt(next);
      writeSeen(key, next);
    }
    setOpen(value => !value);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="prof-bell" ref={root}>
      <button type="button" className="prof-icon-btn" onClick={toggle} aria-haspopup="dialog" aria-expanded={open}
        aria-label={unread ? `알림, 새 알림 ${unread}개` : '알림'} title="알림">
        <Icon name="bell" size={18} />
        {unread > 0 && <span className="prof-bell__count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="prof-bell__panel" role="dialog" aria-label="알림">
          <div className="prof-bell__head">
            <strong>알림</strong>
            <span>답변 · 과제 · 마감 · 공지</span>
          </div>
          {events.length
            ? <StudentActivityList events={events} unreadSince={unreadSince} onNavigate={() => setOpen(false)} />
            : <p className="prof-empty prof-empty--compact">아직 알림이 없습니다.</p>}
        </div>
      )}
    </div>
  );
}
