import gameHtml from '../assets/bomb-game.html?raw';
import { authSession } from '../utils/browserAuthSession';

export default function BombGamePage() {
  const getAuthHeaders = () => {
    const { token } = authSession.getRequestSession();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  };
  return (
    <iframe
      ref={frame => { if (frame) frame.cellAuthHeaders = getAuthHeaders; }}
      srcDoc={gameHtml}
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
      title="폭탄 게이지 푸시"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
