import { useState } from 'react';
import { speciesApi } from '../api';

export default function TaskSpeciesEditor({ taskId, species, value, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const update = async (event) => {
    event.stopPropagation();
    const speciesId = Number(event.target.value);
    setSaving(true);
    try {
      await speciesApi.updateTask(taskId, speciesId);
      await onUpdated?.(speciesId);
    } catch (error) {
      alert(error?.response?.data?.message || '도말 이미지의 동물 종을 변경하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      aria-label="도말 이미지 동물 종 변경"
      value={value || ''}
      disabled={saving}
      onClick={(event) => event.stopPropagation()}
      onChange={update}
      style={{ padding: '4px 7px', border: '1px solid #a5d8ff', borderRadius: '999px', background: '#e7f5ff', color: '#1864ab', fontSize: '11px', fontWeight: '700' }}
    >
      {species.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
  );
}
