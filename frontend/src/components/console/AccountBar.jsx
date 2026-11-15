import { useAuth } from '../../context/AuthContext';
import Icon from '../login/icons';

/**
 * Signed-in user and the logout button, at the right of the console top bar.
 * `showId`: students also see their student number (the login ID).
 */
export default function AccountBar({ showId = false }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const name = user.name || user.username;
  const id = showId && user.name && user.username !== user.name ? user.username : null;
  return (
    <div className="prof-account">
      <span className="prof-account__name" title={id ? `${name} (${id})` : name}>
        <strong>{name}</strong>
        {id && <span className="prof-mono">{id}</span>}
      </span>
      <button type="button" className="prof-account__logout" onClick={logout} title="로그아웃">
        <Icon name="logout" size={16} />
        <span>로그아웃</span>
      </button>
    </div>
  );
}
