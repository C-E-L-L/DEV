import { useCallback, useMemo, useState } from 'react';

const STORAGE_KEY = 'cell-image-display-settings-v1';
export const DEFAULT_IMAGE_DISPLAY_SETTINGS = { brightness: 100, contrast: 100, saturation: 100 };

function readStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getImageDisplayFilter(settings = DEFAULT_IMAGE_DISPLAY_SETTINGS) {
  return `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;
}

export function useImageDisplaySettings(imageKey) {
  const username = localStorage.getItem('username') || 'anonymous';
  const storageId = `${username}:${imageKey || 'default'}`;
  const [storedSettings, setStoredSettings] = useState(readStoredSettings);
  const settings = storedSettings[storageId] || DEFAULT_IMAGE_DISPLAY_SETTINGS;

  const save = useCallback((nextSettings) => {
    setStoredSettings((current) => {
      const next = { ...current, [storageId]: nextSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [storageId]);

  const updateSetting = useCallback((name, value) => {
    save({ ...settings, [name]: Number(value) });
  }, [save, settings]);

  const resetSettings = useCallback(() => save(DEFAULT_IMAGE_DISPLAY_SETTINGS), [save]);
  const filter = useMemo(() => getImageDisplayFilter(settings), [settings]);

  return { settings, filter, updateSetting, resetSettings };
}

export default function ImageDisplayControls({ settings, onChange, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const adjusted = Object.entries(DEFAULT_IMAGE_DISPLAY_SETTINGS).some(([key, value]) => settings[key] !== value);
  const controls = [
    { key: 'brightness', label: '밝기', min: 50, max: 150 },
    { key: 'contrast', label: '대비', min: 50, max: 180 },
    { key: 'saturation', label: '채도', min: 0, max: 180 },
  ];

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        style={{ padding: '6px 10px', border: adjusted ? '1px solid #74c0fc' : '1px solid #ced4da', borderRadius: '6px', background: adjusted ? '#e7f5ff' : '#fff', color: adjusted ? '#1864ab' : '#495057', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}
      >
        🎨 화면 조정{adjusted ? ' •' : ''}
      </button>
      {expanded && (
        <div style={{ position: 'absolute', top: 'calc(100% + 7px)', right: 0, zIndex: 100, width: '270px', padding: '13px', border: '1px solid #ced4da', borderRadius: '8px', background: '#fff', boxShadow: '0 5px 18px rgba(0,0,0,0.18)', color: '#343a40' }}>
          <div style={{ marginBottom: '11px', fontSize: '12px', fontWeight: '800' }}>이미지 화면 조정</div>
          {controls.map((control) => (
            <label key={control.key} style={{ display: 'grid', gridTemplateColumns: '42px 1fr 42px', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '11px' }}>
              <span>{control.label}</span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                value={settings[control.key]}
                onChange={(event) => onChange(control.key, event.target.value)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <strong style={{ textAlign: 'right' }}>{settings[control.key]}%</strong>
            </label>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: '#6c757d' }}>원본 파일은 변경되지 않습니다.</span>
            <button type="button" onClick={onReset} disabled={!adjusted} style={{ padding: '5px 8px', border: '1px solid #ced4da', borderRadius: '5px', background: '#f8f9fa', color: '#495057', cursor: adjusted ? 'pointer' : 'default', opacity: adjusted ? 1 : 0.5, fontSize: '11px', fontWeight: '700' }}>초기화</button>
          </div>
        </div>
      )}
    </div>
  );
}
