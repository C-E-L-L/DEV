export default function SpeciesBadge({ name, code, compact = false, style }) {
  const displayName = name || '개 (Dog)';
  const displayCode = code || 'DOG';
  return (
    <span
      title={`동물 종: ${displayName}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: compact ? '2px 6px' : '4px 8px', borderRadius: '999px',
        background: '#e7f5ff', color: '#1864ab', border: '1px solid #a5d8ff',
        fontSize: compact ? '10px' : '12px', fontWeight: '700', whiteSpace: 'nowrap',
        ...style,
      }}
    >
      🐾 {displayName} <span style={{ opacity: 0.65 }}>({displayCode})</span>
    </span>
  );
}
