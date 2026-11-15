import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/login/icons';
import ActivityList from './ActivityList';
import { useProfessorData } from './ProfessorData';

function readSeen(key) {
  try { return Number(window.localStorage.getItem(key)) || 0; } catch { return 0; }
}
function writeSeen(key, value) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* private mode: unread state lasts for this visit only */ }
}

/**
 * Notifications are the activity feed (submissions, questions, closed deadlines).
 * "Read" is remembered per browser and account: opening the panel marks everything as read.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const { activity } = useProfessorData();
  const key = `cell-prof-notifications-seen:${user.username}`;
  const [seenAt, setSeenAt] = useState(() => readSeen(key));
  const [open, setOpen] = useState(false);
  const [unreadSince, setUnreadSince] = useState(0);
  const root = useRef(null);
  const events = activity.events;
  const unread = events.filter(event => new Date(event.at).getTime() > seenAt).length;

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
            <span>제출 · 질문 · 마감</span>
          </div>
          <ActivityList events={events} unreadSince={unreadSince} onNavigate={() => setOpen(false)} empty="아직 알림이 없습니다." />
        </div>
      )}
    </div>
  );
}
