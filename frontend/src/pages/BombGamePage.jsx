import gameHtml from '../assets/bomb-game.html?raw';

export default function BombGamePage() {
  return (
    <iframe
      srcDoc={gameHtml}
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
      title="폭탄 게이지 푸시"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
