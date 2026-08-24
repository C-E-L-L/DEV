import { useEffect, useState } from 'react';
import { speciesApi } from '../api';

export default function SpeciesDataSettings({ species, onSaved }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (editingId && !species.some((item) => item.id === editingId)) {
      setEditingId(null);
      setEditingName('');
    }
  }, [editingId, species]);

  const normalize = (value) => value.trim().replace(/\s+/g, ' ');

  const createSpecies = async () => {
    const name = normalize(newName);
    if (!name) return;
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await speciesApi.create(name);
      setNewName('');
      onSaved(data);
      setNotice({ type: 'success', text: `동물 종 “${data.name}”을(를) 추가했습니다.` });
    } catch (error) {
      setNotice({ type: 'error', text: error?.response?.data?.message || '동물 종을 추가하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setNotice(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const renameSpecies = async (item) => {
    const name = normalize(editingName);
    if (!name || name === item.name) {
      cancelEditing();
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await speciesApi.rename(item.id, name);
      onSaved(data);
      cancelEditing();
      setNotice({ type: 'success', text: `“${item.name}”의 이름을 “${data.name}”(으)로 수정했습니다.` });
    } catch (error) {
      setNotice({ type: 'error', text: error?.response?.data?.message || '동물 종 이름을 수정하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={infoStyle}>
        동물 종의 표시 이름을 수정하면 기존 도말, 세포 크롭, 문제와 다운로드 메타데이터에도 변경된 이름이 표시됩니다.
        내부 코드와 서버 저장 파일명은 변경되지 않습니다.
      </div>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>새 동물 종 추가</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={newName}
            maxLength={60}
            disabled={saving}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') createSpecies(); }}
            placeholder="예: 말, 소, 토끼"
            aria-label="새 동물 종 이름"
            style={inputStyle}
          />
          <button type="button" onClick={createSpecies} disabled={saving || !newName.trim()} style={primaryButtonStyle}>
            {saving ? '저장 중...' : '종 추가'}
          </button>
        </div>
      </section>

      {notice && (
        <div style={notice.type === 'success' ? successStyle : errorStyle}>{notice.text}</div>
      )}

      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>등록된 동물 종</h3>
          <span style={{ fontSize: '12px', color: '#6c757d' }}>{species.length}개</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr>
                <th style={headStyle}>표시 이름</th>
                <th style={headStyle}>내부 코드</th>
                <th style={headStyle}>구분</th>
                <th style={{ ...headStyle, width: '190px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {species.map((item) => {
                const editing = editingId === item.id;
                return (
                  <tr key={item.id}>
                    <td style={cellStyle}>
                      {editing ? (
                        <input
                          autoFocus
                          value={editingName}
                          maxLength={60}
                          disabled={saving}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') renameSpecies(item);
                            if (event.key === 'Escape') cancelEditing();
                          }}
                          aria-label={`${item.name} 이름 수정`}
                          style={{ ...inputStyle, minWidth: '220px' }}
                        />
                      ) : (
                        <strong>{item.name}</strong>
                      )}
                    </td>
                    <td style={cellStyle}><code style={codeStyle}>{item.code}</code></td>
                    <td style={cellStyle}>
                      <span style={item.builtIn ? builtInBadgeStyle : customBadgeStyle}>
                        {item.builtIn ? '기본 종' : '추가 종'}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      {editing ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" onClick={() => renameSpecies(item)} disabled={saving || !editingName.trim()} style={smallPrimaryStyle}>저장</button>
                          <button type="button" onClick={cancelEditing} disabled={saving} style={smallSecondaryStyle}>취소</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startEditing(item)} disabled={saving} style={smallSecondaryStyle}>이름 수정</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#f8f9fa' }}>
        <h3 style={sectionTitleStyle}>세포 클래스 관리</h3>
        <div style={{ color: '#6c757d', fontSize: '13px' }}>
          종별 세포 클래스 추가·수정과 AI 지원 여부 관리는 추후 업데이트에서 제공할 예정입니다.
        </div>
      </section>
    </div>
  );
}

const sectionStyle = { marginTop: '18px', padding: '18px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' };
const sectionTitleStyle = { margin: '0 0 12px', fontSize: '16px', color: '#343a40' };
const infoStyle = { padding: '12px 14px', border: '1px solid #b6d4fe', borderRadius: '8px', background: '#eef6ff', color: '#24527a', fontSize: '13px', lineHeight: 1.6 };
const inputStyle = { flex: '1 1 280px', maxWidth: '460px', padding: '9px 10px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '14px' };
const primaryButtonStyle = { padding: '9px 15px', border: 'none', borderRadius: '6px', background: '#0056b3', color: '#fff', cursor: 'pointer', fontWeight: '600' };
const smallPrimaryStyle = { padding: '6px 10px', border: 'none', borderRadius: '5px', background: '#0056b3', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const smallSecondaryStyle = { padding: '6px 10px', border: '1px solid #ced4da', borderRadius: '5px', background: '#fff', color: '#495057', cursor: 'pointer', fontSize: '12px' };
const headStyle = { padding: '10px', borderBottom: '2px solid #dee2e6', background: '#f8f9fa', color: '#495057', textAlign: 'left', fontSize: '13px' };
const cellStyle = { padding: '11px 10px', borderBottom: '1px solid #e9ecef', color: '#495057', fontSize: '13px' };
const codeStyle = { padding: '3px 6px', background: '#f1f3f5', borderRadius: '4px', color: '#495057' };
const builtInBadgeStyle = { padding: '4px 8px', borderRadius: '999px', background: '#e7f5ff', color: '#1864ab', fontSize: '11px', fontWeight: '700' };
const customBadgeStyle = { padding: '4px 8px', borderRadius: '999px', background: '#f1f3f5', color: '#495057', fontSize: '11px', fontWeight: '700' };
const successStyle = { marginTop: '12px', padding: '9px 11px', borderRadius: '6px', background: '#d4edda', color: '#155724', fontSize: '13px' };
const errorStyle = { marginTop: '12px', padding: '9px 11px', borderRadius: '6px', background: '#f8d7da', color: '#842029', fontSize: '13px' };
