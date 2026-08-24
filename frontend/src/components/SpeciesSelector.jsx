export default function SpeciesSelector({
  species,
  selectedId,
  onSelect,
  disabled = false,
  label = '동물 종 *',
  helperText = null,
}) {
  const selected = species.find((item) => String(item.id) === String(selectedId));

  return (
    <div onClick={(event) => event.stopPropagation()}>
      {label && <label style={{ display: 'block', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>{label}</label>}
      <select
        value={selectedId || ''}
        onChange={(event) => onSelect(Number(event.target.value))}
        disabled={disabled || species.length === 0}
        style={{ width: '100%', minWidth: '220px', padding: '9px 10px', border: '1px solid #ced4da', borderRadius: '6px', background: '#fff', fontSize: '14px' }}
      >
        {species.map((item) => (
          <option key={item.id} value={item.id}>{item.name} · {item.code}</option>
        ))}
      </select>
      {selected && helperText && <div style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>{helperText}</div>}
    </div>
  );
}
