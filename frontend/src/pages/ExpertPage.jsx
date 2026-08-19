import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskApi, statsApi, cropApi, diagnosticApi, reportApi, labelingApi } from '../api';
import { CELL_KEYS, REPORT_REASONS, imageUrl } from '../constants';
import AuthImage from '../components/AuthImage';
import { fetchAuthImage } from '../utils/fetchAuthImage';

/* ──────────────── 정답률 → 색상 ──────────────── */
function getAccuracyColor(accuracy, totalAnswers = 1) {
  if (totalAnswers === 0) return '#adb5bd';
  if (accuracy >= 80) return '#28a745';
  if (accuracy >= 60) return '#7cb342';
  if (accuracy >= 40) return '#ffc107';
  if (accuracy >= 20) return '#fd7e14';
  return '#dc3545';
}

/* ──────────────── 투표 분포 바 ──────────────── */
function VoteBar({ voteDistribution, votersByLabel, totalAnswers }) {
  const [expandedLabel, setExpandedLabel] = useState(null);

  if (totalAnswers === 0) {
    return <div style={{ color: '#6c757d', fontSize: '14px' }}>No student responses yet</div>;
  }

  return (
    <div style={{ marginTop: '10px' }}>
      {CELL_KEYS.map(label => {
        const count = voteDistribution?.[label] || 0;
        const pct = (count / totalAnswers) * 100;
        const isExpanded = expandedLabel === label;
        const voters = votersByLabel?.[label];
        return (
          <div key={label} style={{ marginBottom: '6px' }}>
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`voters-${label}`}
              onClick={() => setExpandedLabel(current => current === label ? null : label)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', padding: '2px 4px',
                border: 'none', borderRadius: '5px', background: isExpanded ? '#f1f3f5' : 'transparent',
                cursor: 'pointer', font: 'inherit', textAlign: 'left',
              }}
            >
              <span style={{ width: '90px', fontSize: '13px', color: '#495057', fontWeight: '500' }}>{label}</span>
              <span style={{ flex: 1, height: '20px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden', marginRight: '10px' }}>
                <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: pct > 0 ? '#4dabf7' : 'transparent', transition: 'width 0.3s ease' }} />
              </span>
              <span style={{ width: '60px', fontSize: '13px', color: '#495057', textAlign: 'right' }}>
                {count} ({Math.round(pct)}%)
              </span>
              <span aria-hidden="true" style={{ width: '22px', color: '#6c757d', fontSize: '11px', textAlign: 'right' }}>
                {isExpanded ? '▲' : '▼'}
              </span>
            </button>
            {isExpanded && (
              <div
                id={`voters-${label}`}
                style={{
                  margin: '4px 4px 2px 94px', padding: '9px 11px', borderRadius: '6px',
                  background: '#f8f9fa', border: '1px solid #e9ecef', color: '#495057',
                }}
              >
                <div style={{ marginBottom: voters?.length ? '7px' : 0, fontSize: '12px', fontWeight: '700' }}>
                  선택한 학생 ({count}명)
                </div>
                {Array.isArray(voters) ? (
                  voters.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {voters.map((voter, index) => {
                        const studentId = typeof voter === 'string' ? voter : voter.studentId;
                        const displayName = typeof voter === 'string'
                          ? voter
                          : voter.studentDisplayName || (voter.studentName ? `${studentId}_${voter.studentName}` : studentId);
                        return (
                          <span key={`${studentId}-${index}`} style={{ padding: '3px 7px', borderRadius: '999px', background: '#e7f5ff', color: '#1864ab', fontSize: '12px' }}>
                            {displayName}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#868e96' }}>선택한 학생이 없습니다.</div>
                  )
                ) : (
                  <div style={{ fontSize: '12px', color: '#868e96' }}>학생 정보를 불러올 수 없습니다.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function toDateTimeInputValue(value) {
  return value ? String(value).slice(0, 16) : '';
}

function getMinimumDeadlineValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function DeadlineControl({ deadlineAt, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => toDateTimeInputValue(deadlineAt));
  const [saving, setSaving] = useState(false);
  const expired = Boolean(deadlineAt && new Date(deadlineAt).getTime() <= Date.now());

  useEffect(() => setValue(toDateTimeInputValue(deadlineAt)), [deadlineAt]);

  const save = async (event, nextValue = value) => {
    event.stopPropagation();
    setSaving(true);
    try {
      await onSave(nextValue ? `${nextValue}:00` : null);
      setEditing(false);
    } catch (error) {
      alert(error?.response?.data?.message || '마감일 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={(event) => event.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: expired ? '#842029' : '#495057', background: expired ? '#f8d7da' : '#e9ecef', padding: '4px 7px', borderRadius: '999px' }}>
        {deadlineAt ? `${expired ? '마감됨' : '마감'} · ${new Date(deadlineAt).toLocaleString('ko-KR')}` : '마감일 없음'}
      </span>
      {!expired && !editing && (
        <button type="button" onClick={(event) => { event.stopPropagation(); setEditing(true); }} style={{ border: '1px solid #ced4da', background: '#fff', borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}>
          {deadlineAt ? '변경' : '설정'}
        </button>
      )}
      {!expired && editing && (
        <>
          <input type="datetime-local" min={getMinimumDeadlineValue()} value={value} onChange={(event) => setValue(event.target.value)} style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '4px', fontSize: '11px' }} />
          <button type="button" disabled={saving || !value} onClick={save} style={{ border: 'none', background: '#0056b3', color: '#fff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer', fontSize: '11px' }}>저장</button>
          {deadlineAt && <button type="button" disabled={saving} onClick={(event) => save(event, '')} style={{ border: '1px solid #dc3545', background: '#fff', color: '#dc3545', borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}>해제</button>}
          <button type="button" onClick={(event) => { event.stopPropagation(); setEditing(false); setValue(toDateTimeInputValue(deadlineAt)); }} style={{ border: 'none', background: 'transparent', color: '#6c757d', cursor: 'pointer', fontSize: '11px' }}>취소</button>
        </>
      )}
    </div>
  );
}

function GtProgressBadge({ progress, completeLabel = '✓ 완료', incompleteLabel = 'GT' }) {
  const baseStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    padding: '5px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
  };

  if (!progress || progress.status === 'idle' || progress.status === 'loading') {
    return <span style={{ ...baseStyle, background: '#e9ecef', color: '#6c757d' }}>GT 확인 중...</span>;
  }
  if (progress.status === 'error') {
    return <span style={{ ...baseStyle, background: '#e9ecef', color: '#6c757d' }}>GT 확인 불가</span>;
  }
  if (progress.total <= 0) {
    return <span style={{ ...baseStyle, background: '#e9ecef', color: '#6c757d' }}>세포 없음</span>;
  }

  const complete = progress.completed === progress.total;
  return (
    <span style={{
      ...baseStyle,
      background: complete ? '#d4edda' : '#f8d7da',
      color: complete ? '#155724' : '#842029',
    }}>
      {complete
        ? `${completeLabel} · ${progress.completed}/${progress.total}`
        : `${incompleteLabel} ${progress.completed}/${progress.total}`}
    </span>
  );
}

const CLASS_COLORS = {
  Segment:     '#4dabf7',
  Band:        '#ff922b',
  Lymphocyte:  '#51cf66',
  Monocyte:    '#cc5de8',
  Eosinophil:  '#ff6b6b',
  NucleatedRBC:'#20c997',
};

function emptyDistribution() {
  return CELL_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
}

function isDiagnosticTask(task) {
  return !task?.originalFilename || (task?.uploadedFilename || '').startsWith('diagnostic-');
}

function autoDistributeByTotal(total, availableByClass) {
  const target = Math.max(0, Number(total) || 0);
  const result = emptyDistribution();
  if (target === 0) return result;

  let assigned = 0;
  while (assigned < target) {
    let progressed = false;
    for (const key of CELL_KEYS) {
      const max = Number(availableByClass?.[key] || 0);
      if (result[key] < max) {
        result[key] += 1;
        assigned += 1;
        progressed = true;
        if (assigned >= target) break;
      }
    }
    if (!progressed) break;
  }
  return result;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMatrixCellStyle(count, rowTotal, isCorrect) {
  if (!rowTotal || count === 0) {
    return { background: '#fff', color: '#adb5bd', fontWeight: 'normal' };
  }

  const pct = count / rowTotal;
  const alpha = clamp(0.15 + pct * 0.85, 0.15, 0.95);
  const base = isCorrect ? '40, 167, 69' : '220, 53, 69';
  const textColor = isCorrect ? '#155724' : '#721c24';

  return {
    background: `rgba(${base}, ${alpha})`,
    color: textColor,
    fontWeight: '600',
  };
}

function getReportCategory(reason) {
  const normalized = (reason || '').trim();
  if (REPORT_REASONS.includes(normalized)) return normalized;
  return '기타';
}

/* ──────────────── Main ExpertPage ──────────────── */
export default function ExpertPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(1);

  /* ── Tab 1: Assignment Creation ── */
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(0);
  const [formErrors, setFormErrors] = useState({ title: false, files: false });
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [selectedResultTaskIndex, setSelectedResultTaskIndex] = useState(0);

  /* 다른 탭에 갔다 오면 이전 분석 결과는 지우고 초기 화면으로 되돌린다 */
  useEffect(() => {
    if (activeTab === 1) return;
    setUploadResult(null);
    setSelectedResultTaskIndex(0);
    setAssignmentDeadline('');
    setFormErrors({ title: false, files: false });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 1) return;
    if (!uploadResult || !resultCanvasRef.current) return;
    const tasks = uploadResult.tasks || [];
    if (tasks.length === 0) return;
    const taskResult = tasks[selectedResultTaskIndex] || tasks[0];
    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let cancelled = false;

    fetchAuthImage(imageUrl.original(taskResult.originalImage))
      .then(url => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          if (cancelled) return;
          const maxWidth = 860;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          (taskResult.crops || []).forEach((crop) => {
            if (!crop.bbox) return;
            const bbox = JSON.parse(crop.bbox.replace(/'/g, '"'));
            const [x1, y1, x2, y2] = bbox;
            const color = CLASS_COLORS[crop.pseudoLabel] || '#adb5bd';
            const sx = x1 * scale, sy = y1 * scale;
            const sw = (x2 - x1) * scale, sh = (y2 - y1) * scale;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, sw, sh);
            const label = crop.pseudoLabel || '?';
            const conf = crop.aiClassificationConfidence != null
              ? ` ${Math.round(crop.aiClassificationConfidence * 100)}%` : '';
            const text = label + conf;
            ctx.font = 'bold 12px Arial';
            const tw = ctx.measureText(text).width;
            ctx.fillStyle = color;
            ctx.fillRect(sx, sy - 17, tw + 8, 17);
            ctx.fillStyle = '#fff';
            ctx.fillText(text, sx + 4, sy - 4);
          });
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [activeTab, uploadResult, selectedResultTaskIndex]);

  const UPLOAD_STEPS = [
    { icon: '📤', label: '이미지 서버에 전송 중...' },
    { icon: '🔍', label: 'YOLO: 세포 영역 탐지 중...' },
    { icon: '🧬', label: 'DenseNet: 세포 분류 중...' },
    { icon: '💾', label: '과제 데이터 저장 중...' },
  ];

  useEffect(() => {
    if (!uploading) { setUploadStep(0); return; }
    setUploadStep(1);
    const t1 = setTimeout(() => setUploadStep(2), 1500);
    const t2 = setTimeout(() => setUploadStep(3), 4000);
    const t3 = setTimeout(() => setUploadStep(4), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [uploading]);

  /* ── Tab 2: Analytics ── */
  const [analyticsSubTab, setAnalyticsSubTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [editingGt, setEditingGt] = useState(false);
  const [allCellStats, setAllCellStats] = useState([]);
  const [gtProgressStatus, setGtProgressStatus] = useState('idle');
  const [reportItems, setReportItems] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState(
    () => Object.fromEntries(REPORT_REASONS.map((reason) => [reason, true]))
  );

  /* ── Tab 3: Diagnostic Evaluation ── */
  const [poolStats, setPoolStats] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [classDistribution, setClassDistribution] = useState(emptyDistribution);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticCreating, setDiagnosticCreating] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticError, setDiagnosticError] = useState('');

  /* ── Canvas ── */
  const canvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  // ========================================================
  // ⭐ [여기에 아래 상태 변수와 함수를 꼭 추가해 주세요!] ⭐
  const [studentMatrices, setStudentMatrices] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const diagnosticTaskOrder = [...tasks]
    .filter(isDiagnosticTask)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;
      return (a.id || 0) - (b.id || 0);
    })
    .reduce((acc, task, index) => {
      acc.set(task.id, index + 1);
      return acc;
    }, new Map());
  const selectedAnalyticsTask = tasks.find(task => task.id === selectedTaskId);

  const { assignmentGroups, individualTasks } = useMemo(() => {
    const assignmentMap = {};
    const individual = [];
    tasks.filter(t => !isDiagnosticTask(t)).forEach(task => {
      if (task.assignmentId) {
        if (!assignmentMap[task.assignmentId]) {
          assignmentMap[task.assignmentId] = {
            id: task.assignmentId,
            title: task.title || `Assignment #${task.assignmentId}`,
            tasks: [],
          };
        }
        assignmentMap[task.assignmentId].tasks.push(task);
      } else {
        individual.push(task);
      }
    });
    return { assignmentGroups: Object.values(assignmentMap), individualTasks: individual };
  }, [tasks]);
  const gtSummaryByTaskId = useMemo(() => {
    const summary = new Map();
    allCellStats.forEach((crop) => {
      const current = summary.get(crop.taskId) || { total: 0, completed: 0 };
      current.total += 1;
      if (crop.finalLabel) current.completed += 1;
      summary.set(crop.taskId, current);
    });
    return summary;
  }, [allCellStats]);

  const getTaskGtProgress = (task) => {
    const summary = gtSummaryByTaskId.get(task.id);
    return {
      status: gtProgressStatus,
      total: summary?.total ?? Number(task.cropCount || 0),
      completed: summary?.completed ?? 0,
    };
  };

  const getAssignmentGtProgress = (groupTasks) => groupTasks.reduce(
    (progress, task) => {
      const taskProgress = getTaskGtProgress(task);
      return {
        status: gtProgressStatus,
        total: progress.total + taskProgress.total,
        completed: progress.completed + taskProgress.completed,
      };
    },
    { status: gtProgressStatus, total: 0, completed: 0 }
  );
  const taskFilenameById = new Map(
    tasks.map(task => [task.id, task.uploadedFilename || task.originalFilename])
  );
  const displaySmearFilename = (item) =>
    taskFilenameById.get(item.taskId) || item.originalSmearFilename || '-';
  const selectedCropIndex = stats.findIndex(crop => crop.cropId === selectedCrop?.cropId);
  const selectedTaskGtProgress = {
    status: 'ready',
    total: stats.length,
    completed: stats.filter(crop => Boolean(crop.finalLabel)).length,
  };

  const selectCropAt = (index) => {
    if (index < 0 || index >= stats.length) return;
    setSelectedCrop(stats[index]);
  };

  const refreshAllCellStats = useCallback(async () => {
    setGtProgressStatus('loading');
    try {
      const { data } = await statsApi.getAll();
      setAllCellStats(data || []);
      setGtProgressStatus('ready');
      return data;
    } catch (error) {
      console.error('GT 진행 상태 조회 실패:', error);
      setGtProgressStatus('error');
      return null;
    }
  }, []);

  const fetchStudentMatrices = useCallback(async () => {
    setSelectedStudent(null);
    try {
      const { data } = await diagnosticApi.getStudentMatrices();
      setStudentMatrices(data.studentMatrices || []);
      if (data.studentMatrices && data.studentMatrices.length > 0) {
        setSelectedStudent(data.studentMatrices[0]);
      }
    } catch (error) {
      console.error("학생 누적 혼동행렬 조회 실패:", error);
      alert("혼동행렬 데이터를 불러오는데 실패했습니다.");
    }
  }, []);
  // ========================================================

  /* ── Analytics 탭 열릴 때 데이터 로드 ── */
  useEffect(() => {
    if (activeTab !== 2) return;
    taskApi.getAll().then(({ data }) => setTasks(data)).catch(console.error);
    refreshAllCellStats();
  }, [activeTab, refreshAllCellStats]);

  useEffect(() => {
    if (activeTab !== 2 || analyticsSubTab !== 'students') return;
    fetchStudentMatrices();
  }, [activeTab, analyticsSubTab, fetchStudentMatrices]);

  useEffect(() => {
    if (activeTab !== 2 || analyticsSubTab !== 'reports') return;
    setReportLoading(true);
    reportApi.getAll()
      .then(({ data }) => setReportItems(data || []))
      .catch(() => setReportItems([]))
      .finally(() => setReportLoading(false));
  }, [activeTab, analyticsSubTab]);

  useEffect(() => {
    if (activeTab !== 3) return;
    setDiagnosticLoading(true);
    diagnosticApi.getPoolStats()
      .then(({ data }) => {
        setPoolStats(data);
        const initialTotal = Math.min(20, data.totalAvailable || 0);
        setTotalQuestions(initialTotal);
        setClassDistribution(autoDistributeByTotal(initialTotal, data.availableByClass || {}));
      })
      .catch(() => setDiagnosticError('진단 데이터셋 정보를 불러오지 못했습니다.'))
      .finally(() => setDiagnosticLoading(false));
  }, [activeTab]);

  /* ── Task 선택 → stats + 원본 이미지 로드 ── */
  const fetchTaskStats = useCallback(async (taskId, preferredCropId = null) => {
    setSelectedTaskId(taskId);
    setSelectedCrop(null);
    const { data } = await statsApi.getByTaskId(taskId);
    setStats(data);
    setSelectedCrop(data.find(crop => crop.cropId === preferredCropId) || data[0] || null);

    const task = tasks.find(t => t.id === taskId) || (await taskApi.getAll()).data.find(t => t.id === taskId);
    if (task?.originalFilename) {
      setImageLoaded(false);
      fetchAuthImage(imageUrl.original(task.originalFilename))
        .then(url => {
          const img = new Image();
          img.onload = () => { URL.revokeObjectURL(url); setOriginalImage(img); setImageLoaded(true); };
          img.onerror = () => URL.revokeObjectURL(url);
          img.src = url;
        })
        .catch(() => {});
    } else {
      setOriginalImage(null);
      setImageLoaded(false);
    }
  }, [tasks]);

  /* ── Canvas 렌더링: 이미지 + 바운딩 박스 ── */
  useEffect(() => {
    if (!canvasRef.current || !originalImage || !imageLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxWidth = 700;
    const scale = maxWidth / originalImage.width;
    canvas.width = maxWidth;
    canvas.height = originalImage.height * scale;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    stats.forEach((crop, index) => {
      if (!crop.bbox) return;
      const bbox = JSON.parse(crop.bbox.replace(/'/g, '"'));
      const [x1, y1, x2, y2] = bbox;
      const color = getAccuracyColor(crop.accuracyRate, crop.totalAnswers);

      ctx.strokeStyle = color;
      ctx.lineWidth = selectedCrop?.cropId === crop.cropId ? 4 : 2;
      ctx.strokeRect(x1 * scale, y1 * scale, (x2 - x1) * scale, (y2 - y1) * scale);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${index + 1}`, x1 * scale + 2, y1 * scale - 4);
    });
  }, [originalImage, imageLoaded, stats, selectedCrop]);

  /* ── 다른 셀로 옮기면 GT 수정 모드는 닫는다 ── */
  useEffect(() => { setEditingGt(false); }, [selectedCrop?.cropId]);

  /* ── Canvas 클릭 → 셀 선택 ── */
  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !originalImage) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const imgScale = canvas.width / originalImage.width;

    for (const crop of stats) {
      if (!crop.bbox) continue;
      const bbox = JSON.parse(crop.bbox.replace(/'/g, '"'));
      const [x1, y1, x2, y2] = bbox;
      if (x >= x1 * imgScale && x <= x2 * imgScale && y >= y1 * imgScale && y <= y2 * imgScale) {
        setSelectedCrop(crop);
        return;
      }
    }
  };

  /* ── Delete Task / Assignment ── */
  const handleDeleteTask = async (task, e) => {
    e.stopPropagation();
    if (task.assignmentId) {
      if (!window.confirm(`과제 "${task.title}"를 전체 삭제하시겠습니까?\n(모든 도말 이미지, 제출 기록이 삭제됩니다.)`)) return;
      try {
        await taskApi.deleteAssignment(task.assignmentId);
        setTasks(prev => prev.filter(t => t.assignmentId !== task.assignmentId));
        if (tasks.find(t => t.assignmentId === task.assignmentId && t.id === selectedTaskId)) {
          setSelectedTaskId(null); setStats([]);
        }
        setSelectedAssignmentId(null);
      } catch { alert('삭제에 실패했습니다.'); }
    } else {
      if (!window.confirm(`Task #${task.id}를 삭제하시겠습니까?\n관련 제출 기록과 혼동행렬도 모두 삭제됩니다.`)) return;
      try {
        await taskApi.delete(task.id);
        setTasks(prev => prev.filter(t => t.id !== task.id));
        if (selectedTaskId === task.id) { setSelectedTaskId(null); setStats([]); }
      } catch { alert('삭제에 실패했습니다.'); }
    }
  };

  const handleUpdateDeadline = async (scopeType, scopeId, deadlineAt) => {
    if (scopeType === 'assignment') {
      await taskApi.updateAssignmentDeadline(scopeId, deadlineAt);
    } else {
      await taskApi.updateDeadline(scopeId, deadlineAt);
    }
    const { data } = await taskApi.getAll();
    setTasks(data);
  };

  /* ── Confirm Label ── */
  const handleConfirmLabel = async (cropId, finalLabel) => {
    try {
      await cropApi.confirm(cropId, finalLabel);
      setEditingGt(false);
      /* 확정/수정 후에도 같은 셀을 계속 보고 있도록 선택을 유지한다 */
      const { data } = await statsApi.getByTaskId(selectedTaskId);
      setStats(data);
      setSelectedCrop(data.find(c => c.cropId === cropId) || null);
      await refreshAllCellStats();
    } catch { alert("Confirmation failed."); }
  };

  const handleLabelingExport = async (taskId) => {
    try {
      const { data } = await labelingApi.exportTask(taskId);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task_${taskId}_labeling.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('라벨링 ZIP을 생성하지 못했습니다.');
    }
  };

  const handleLabelingImport = async (taskId, file) => {
    if (!file) return;
    try {
      const manifest = JSON.parse(await file.text());
      const { data } = await labelingApi.importTask(taskId, manifest);
      await fetchTaskStats(taskId);
      await refreshAllCellStats();
      alert(`${data.updated}개 세포의 GT 라벨을 반영했습니다.`);
    } catch {
      alert('annotations.json 형식 또는 라벨 값을 확인해 주세요.');
    }
  };

  /* ── Assignment Upload 핸들러 ── */
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
      setUploadResult(null);
      setFormErrors(prev => ({ ...prev, files: false }));
    }
  };
  const handleRemoveFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (dropped.length > 0) {
      setFiles(prev => [...prev, ...dropped]);
      setPreviews(prev => [...prev, ...dropped.map(f => URL.createObjectURL(f))]);
      setUploadResult(null);
      setFormErrors(prev => ({ ...prev, files: false }));
    }
  };
  const handleUpload = async () => {
    /* 필수 항목 검증 — 버튼을 막는 대신 어디를 채워야 하는지 표시한다 */
    const nextErrors = { title: !assignmentTitle.trim(), files: files.length === 0 };
    if (nextErrors.title || nextErrors.files) {
      setFormErrors(nextErrors);
      const target = nextErrors.title ? titleInputRef.current : dropZoneRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (nextErrors.title) titleInputRef.current?.focus();
      return;
    }
    setFormErrors({ title: false, files: false });
    setUploading(true);
    setUploadingImageIndex(0);
    try {
      const formData = new FormData();
      formData.append('title', assignmentTitle.trim());
      if (assignmentDeadline) formData.append('deadlineAt', `${assignmentDeadline}:00`);
      files.forEach(f => formData.append('files', f));
      const { data } = await taskApi.createAssignment(formData);
      setUploadResult(data);
      setSelectedResultTaskIndex(0);
      setFiles([]); setPreviews([]); setAssignmentTitle(''); setAssignmentDeadline('');
    } catch { alert('업로드에 실패했습니다.'); }
    finally { setUploading(false); }
  };

  const handleAutoDistribute = useCallback(() => {
    if (!poolStats) return;
    setClassDistribution(autoDistributeByTotal(totalQuestions, poolStats.availableByClass || {}));
  }, [poolStats, totalQuestions]);

  const handleDistributionChange = (label, value) => {
    const max = Number(poolStats?.availableByClass?.[label] || 0);
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, max)) : 0;
    setClassDistribution(prev => ({ ...prev, [label]: safe }));
  };

  const handleCreateDiagnosticTask = async () => {
    setDiagnosticError('');
    setDiagnosticResult(null);
    setDiagnosticCreating(true);
    try {
      const payload = {
        totalQuestions: Number(totalQuestions),
        classDistribution: classDistribution,
      };
      const { data } = await diagnosticApi.createTask(payload);
      setDiagnosticResult(data);
    } catch (err) {
      const message = err?.response?.data?.message || '진단평가 과제 생성에 실패했습니다.';
      setDiagnosticError(message);
    } finally {
      setDiagnosticCreating(false);
    }
  };

  const availableByClass = poolStats?.availableByClass || {};
  const maxTotalQuestions = Number(poolStats?.totalAvailable || 0);
  const distributionTotal = CELL_KEYS.reduce((sum, key) => sum + Number(classDistribution[key] || 0), 0);
  const isDistributionValid = distributionTotal === Number(totalQuestions);
  const isTotalWithinRange = Number(totalQuestions) > 0 && Number(totalQuestions) <= maxTotalQuestions;
  const canCreateDiagnostic = !diagnosticLoading && !diagnosticCreating && isDistributionValid && isTotalWithinRange;

  /* ────────────────────────────────────────── */
  /* ──────────────── RENDER ──────────────── */
  /* ────────────────────────────────────────── */

  return (
    <div style={containerStyle}>
      {/* ── 탭 ── */}
      <div style={tabBar}>
        <button onClick={() => setActiveTab(1)} style={activeTab === 1 ? tabActive : tabInactive}>1. Task Management</button>
        <button onClick={() => setActiveTab(2)} style={activeTab === 2 ? tabActive : tabInactive}>2. Analytics &amp; Feedback</button>
        <button onClick={() => setActiveTab(3)} style={activeTab === 3 ? tabActive : tabInactive}>3. Diagnostic Evaluation</button>
      </div>

      {/* ============= Tab 1: Task Management ============= */}
      {activeTab === 1 && (
        <div style={boxStyle}>
          <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>Create New Assignment</h2>

          {/* 과제 이름 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>
              과제 이름 *
            </label>
            <input
              ref={titleInputRef}
              value={assignmentTitle}
              onChange={e => {
                setAssignmentTitle(e.target.value);
                if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, title: false }));
              }}
              placeholder="예: Week 3 혈액도말 분류 과제"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box',
                border: `1px solid ${formErrors.title ? '#dc3545' : '#ced4da'}`,
                background: formErrors.title ? '#fff5f5' : '#fff',
                outline: 'none',
                boxShadow: formErrors.title ? '0 0 0 3px rgba(220,53,69,0.15)' : 'none',
              }}
            />
            {formErrors.title && (
              <div style={fieldErrorStyle}>⚠️ 과제 이름을 입력해 주세요.</div>
            )}
          </div>

          {/* 드래그 앤 드롭 — 다중 파일 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>
              마감일 (선택)
            </label>
            <input
              type="datetime-local"
              min={getMinimumDeadlineValue()}
              value={assignmentDeadline}
              onChange={(event) => setAssignmentDeadline(event.target.value)}
              style={{ width: '100%', maxWidth: '360px', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>
              마감일이 지나면 제출이 잠기고 학생의 제출 결과가 공개됩니다.
            </div>
          </div>

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...dropZoneStyle,
              borderColor: isDragging ? '#0056b3' : formErrors.files ? '#dc3545' : '#ced4da',
              background: isDragging ? '#e7f3ff' : formErrors.files ? '#fff5f5' : '#fff',
            }}
          >
            <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
              <div style={{ fontSize: '16px', color: '#495057', marginBottom: '5px' }}><strong>Drag &amp; Drop</strong> 혈액도말 이미지 (여러 장 가능)</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>or click to browse</div>
            </div>
          </div>
          {formErrors.files && (
            <div style={fieldErrorStyle}>⚠️ 도말 이미지를 최소 1장 선택해 주세요.</div>
          )}

          {/* 선택된 파일 목록 */}
          {previews.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: '600', color: '#495057', marginBottom: '10px' }}>
                선택된 도말 이미지 ({previews.length}장)
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {previews.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={src} alt={`preview-${idx}`} style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', textAlign: 'center', padding: 0 }}
                    >✕</button>
                    <div style={{ fontSize: '10px', color: '#6c757d', textAlign: 'center', marginTop: '2px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {files[idx]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleUpload} disabled={uploading} style={uploading ? btnDisabled : btnActive}>
              {uploading ? `분석 중 (${uploadingImageIndex}/${files.length})...` : `🔬 Analyze & Create Assignment (${files.length}장)`}
            </button>
            {!uploading && (!assignmentTitle.trim() || files.length === 0) && (
              <span style={{ fontSize: '13px', color: formErrors.title || formErrors.files ? '#dc3545' : '#6c757d' }}>
                {[!assignmentTitle.trim() && '과제 이름', files.length === 0 && '도말 이미지'].filter(Boolean).join(', ')}
                {' '}입력이 필요합니다
              </span>
            )}
          </div>

          {uploading && (
            <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontWeight: '600', color: '#495057', marginBottom: '16px', fontSize: '14px' }}>AI 분석 진행 중</div>
              {UPLOAD_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isDone = uploadStep > stepNum;
                const isActive = uploadStep === stepNum;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', opacity: uploadStep >= stepNum ? 1 : 0.3 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                      background: isDone ? '#d4edda' : isActive ? '#cce5ff' : '#f8f9fa',
                      border: `2px solid ${isDone ? '#28a745' : isActive ? '#0056b3' : '#dee2e6'}`,
                    }}>
                      {isDone ? '✓' : step.icon}
                    </div>
                    <span style={{ fontSize: '14px', color: isDone ? '#28a745' : isActive ? '#0056b3' : '#adb5bd', fontWeight: isActive ? '600' : 'normal' }}>
                      {step.label}
                      {isActive && <span style={{ marginLeft: '6px', animation: 'none' }}>⏳</span>}
                    </span>
                  </div>
                );
              })}
              <div style={{ marginTop: '14px', height: '6px', background: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(uploadStep / UPLOAD_STEPS.length) * 100}%`, background: '#0056b3', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}

          {uploadResult && (
            <>
              <div style={successBox}>
                ✅ <strong>"{uploadResult.title}"</strong> 과제 생성 완료 —{' '}
                <strong>{uploadResult.tasks?.length}</strong>장 도말, 총{' '}
                <strong>{uploadResult.totalCrops}</strong>개 세포
              </div>

              <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontWeight: '600', color: '#495057', marginBottom: '14px', fontSize: '15px' }}>
                  탐지 결과 — 도말 이미지 선택
                </div>

                {/* 도말 선택 탭 */}
                {uploadResult.tasks?.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {uploadResult.tasks.map((t, idx) => (
                      <button key={idx} onClick={() => setSelectedResultTaskIndex(idx)} style={{
                        padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #dee2e6',
                        background: selectedResultTaskIndex === idx ? '#495057' : '#f8f9fa',
                        color: selectedResultTaskIndex === idx ? '#fff' : '#495057', fontWeight: selectedResultTaskIndex === idx ? '600' : 'normal',
                      }}>
                        이미지 {idx + 1} ({t.totalDetected}개)
                      </button>
                    ))}
                  </div>
                )}

                {/* 범례 */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                    <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#495057' }}>
                      <div style={{ width: '14px', height: '14px', background: color, borderRadius: '3px' }} />
                      {cls}
                    </div>
                  ))}
                </div>

                <canvas ref={resultCanvasRef} style={{ width: '100%', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                  바운딩 박스 위: 예측 클래스 + 분류 신뢰도(%)
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============= Tab 2: Analytics ============= */}
      {activeTab === 2 && (
        <div style={boxStyle}>
          {/* 서브탭 */}
          <div style={subTabBar}>
            <button onClick={() => setAnalyticsSubTab('tasks')} style={analyticsSubTab === 'tasks' ? subTabActive : subTabInactive}>📋 Tasks</button>
            <button onClick={() => setAnalyticsSubTab('cells')} style={analyticsSubTab === 'cells' ? subTabActive : subTabInactive}>🔬 Cells</button>
            <button onClick={() => setAnalyticsSubTab('students')} style={analyticsSubTab === 'students' ? subTabActive : subTabInactive}>🧑‍🎓 Student Matrices</button>
            <button onClick={() => setAnalyticsSubTab('reports')} style={analyticsSubTab === 'reports' ? subTabActive : subTabInactive}>Reports</button>
          </div>

          {/* ───── Tasks 서브탭 ───── */}
          {analyticsSubTab === 'tasks' && (
            <div>
              {/* ── 과제 내부 뷰: 선택된 assignment의 도말 목록 ── */}
              {selectedAssignmentId ? (() => {
                const group = assignmentGroups.find(g => g.id === selectedAssignmentId);
                if (!group) return null;
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => { setSelectedAssignmentId(null); setSelectedTaskId(null); setStats([]); setSelectedCrop(null); }}
                          style={{ background: 'none', border: '1px solid #ced4da', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#495057', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >← 목록으로</button>
                        <h3 style={{ ...sectionHeader, margin: 0 }}>{group.title}</h3>
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>({group.tasks.length}개 도말)</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteTask(group.tasks[0], e)}
                        style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}
                      >과제 삭제</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
                      {group.tasks.map((task, idx) => (
                        <div key={task.id} style={{ position: 'relative' }}>
                          <button onClick={() => fetchTaskStats(task.id)} style={{
                            ...taskBtnStyle,
                            ...(selectedTaskId === task.id ? { background: '#495057', color: '#fff', borderColor: '#495057' } : {}),
                            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', minWidth: '180px',
                          }}>
                            <AuthImage src={imageUrl.thumbnail(task.originalFilename)} fallbackSrc={imageUrl.original(task.originalFilename)} alt={`Smear ${idx + 1}`} style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', border: '1px solid #dee2e6' }} />
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>도말 #{idx + 1}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', wordBreak: 'break-all', textAlign: 'center' }}>
                              {task.uploadedFilename || task.originalFilename}
                            </div>
                            <div style={{ marginTop: '8px' }}>
                              <GtProgressBadge progress={getTaskGtProgress(task)} completeLabel="✓ GT 완료" />
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                /* ── 과제 목록 뷰 ── */
                <div>
                  <h3 style={sectionHeader}>Select a Task</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                    {/* 과제 그룹 카드 */}
                    {assignmentGroups.map(group => (
                      <div key={group.id} style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '14px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                        onClick={() => { setSelectedAssignmentId(group.id); setSelectedTaskId(null); setStats([]); setSelectedCrop(null); }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <AuthImage src={imageUrl.thumbnail(group.tasks[0]?.originalFilename)} fallbackSrc={imageUrl.original(group.tasks[0]?.originalFilename)} alt={group.title} style={{ width: '72px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#212529' }}>{group.title}</div>
                          <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '3px' }}>도말 {group.tasks.length}개</div>
                        </div>
                        <DeadlineControl
                          deadlineAt={group.tasks[0]?.deadlineAt}
                          onSave={(deadlineAt) => handleUpdateDeadline('assignment', group.id, deadlineAt)}
                        />
                        <GtProgressBadge progress={getAssignmentGtProgress(group.tasks)} completeLabel="✓ COMPLETE" />
                        <span style={{ fontSize: '13px', color: '#adb5bd' }}>▶</span>
                        <button
                          onClick={(e) => handleDeleteTask(group.tasks[0], e)}
                          title="과제 삭제"
                          style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}

                    {/* 개별 과제 (assignment 없는 것) */}
                    {individualTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => fetchTaskStats(task.id)}
                        style={{
                          border: selectedTaskId === task.id ? '2px solid #495057' : '1px solid #dee2e6',
                          borderRadius: '8px',
                          padding: selectedTaskId === task.id ? '13px 15px' : '14px 16px',
                          background: selectedTaskId === task.id ? '#f8f9fa' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <AuthImage
                          src={imageUrl.thumbnail(task.originalFilename)}
                          fallbackSrc={imageUrl.original(task.originalFilename)}
                          alt={`Task ${task.id}`}
                          style={{ width: '72px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#212529' }}>
                            {task.title || `Task #${task.id}`}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Task #{task.id} · {task.uploadedFilename || task.originalFilename}
                          </div>
                        </div>
                        <DeadlineControl
                          deadlineAt={task.deadlineAt}
                          onSave={(deadlineAt) => handleUpdateDeadline('task', task.id, deadlineAt)}
                        />
                        <GtProgressBadge progress={getTaskGtProgress(task)} completeLabel="✓ COMPLETE" />
                        <span style={{ fontSize: '13px', color: '#adb5bd' }}>▶</span>
                        <button
                          onClick={(e) => handleDeleteTask(task, e)}
                          title="삭제"
                          style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}

                    {/* Diagnostic Tasks */}
                    {tasks.filter(isDiagnosticTask).length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnostic Tasks</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {tasks.filter(isDiagnosticTask).map(task => {
                            const diagnosticNumber = diagnosticTaskOrder.get(task.id);
                            const isSelected = selectedTaskId === task.id;
                            return (
                              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => fetchTaskStats(task.id)} style={{
                                  flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px',
                                  border: `1px solid ${isSelected ? '#495057' : '#dee2e6'}`, borderRadius: '8px',
                                  background: isSelected ? '#495057' : '#fff', color: isSelected ? '#fff' : 'inherit',
                                  cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s',
                                }}>
                                  <div style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : '#e9ecef', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: isSelected ? '#fff' : '#495057', flexShrink: 0 }}>DIAG</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Diagnostic #{diagnosticNumber || task.id}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px', wordBreak: 'break-all' }}>{task.uploadedFilename}</div>
                                  </div>
                                  <span style={{ fontSize: '13px', opacity: 0.5 }}>▶</span>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteTask(task, e)}
                                  title="삭제"
                                  style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                >✕</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTaskId && stats.length > 0 && selectedAnalyticsTask && !isDiagnosticTask(selectedAnalyticsTask) && (
                <div style={labelingToolsStyle}>
                  <div>
                    <strong>JSON Labeling</strong>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '3px' }}>
                      읽기 쉬운 파일명의 이미지 묶음과 annotations.json을 내려받아 라벨링할 수 있습니다.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleLabelingExport(selectedTaskId)} style={labelingActionStyle}>Export ZIP</button>
                    <label style={labelingActionStyle}>
                      Import JSON
                      <input
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          handleLabelingImport(selectedTaskId, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* ── 이미지/셀목록 + 셀 패널 ── */}
              {selectedTaskId && stats.length > 0 && selectedAnalyticsTask && (
                <div style={{ display: 'flex', gap: '25px', marginTop: '20px' }}>
                  {isDiagnosticTask(selectedAnalyticsTask) ? (
                    /* 진단평가: 셀 목록 */
                    <div style={{ flex: '0 0 400px' }}>
                      <h3 style={sectionHeader}>Cell List ({stats.length}개)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                        {stats.map((crop, idx) => {
                          const isSelected = selectedCrop?.cropId === crop.cropId;
                          const color = getAccuracyColor(crop.accuracyRate, crop.totalAnswers);
                          return (
                            <div key={crop.cropId} onClick={() => setSelectedCrop(crop)} style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                              border: `2px solid ${isSelected ? '#495057' : '#dee2e6'}`,
                              borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#f0f4f8' : '#fff',
                              transition: 'border-color 0.15s',
                            }}>
                              <AuthImage src={imageUrl.crop(crop.filename)} alt={`Cell ${idx + 1}`} style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '6px', background: '#f8f9fa', border: '1px solid #eee', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>#{idx + 1}</div>
                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                  GT: <strong>{crop.finalLabel || crop.gtLabel || '미설정'}</strong>
                                </div>
                                <div style={{ fontSize: '11px', color: '#adb5bd', marginTop: '1px' }}>{crop.totalAnswers}명 응답</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '17px', fontWeight: '700', color }}>{crop.finalLabel && crop.totalAnswers > 0 ? `${crop.accuracyRate}%` : 'N/A'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* 일반 과제: 혈액도말 이미지 + 바운딩 박스 */
                    <div style={{ flex: '0 0 720px' }}>
                    <h3 style={sectionHeader}>Blood Smear Image</h3>
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                      <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ width: '100%', cursor: 'pointer', borderRadius: '4px' }} />
                      {/* 범례 */}
                      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#495057', fontWeight: '600' }}>Accuracy Legend:</span>
                        {[
                          { color: '#adb5bd', label: 'N/A' },
                          { color: '#dc3545', label: '0-20%' },
                          { color: '#fd7e14', label: '20-40%' },
                          { color: '#ffc107', label: '40-60%' },
                          { color: '#7cb342', label: '60-80%' },
                          { color: '#28a745', label: '80-100%' },
                        ].map(({ color, label }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '16px', height: '16px', background: color, borderRadius: '3px' }} />
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '10px' }}>
                        Click on a bounding box to view cell details. Colors indicate student accuracy rate.
                      </p>
                    </div>

                    <div style={{ marginTop: '18px', border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                      <div style={{ ...professorPanelHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span>🔍 감지된 세포 목록</span>
                        <GtProgressBadge progress={selectedTaskGtProgress} incompleteLabel="GT 설정" />
                      </div>
                      <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px' }}>
                        {stats.map((crop, index) => {
                          const isSelected = crop.cropId === selectedCrop?.cropId;
                          const hasGroundTruth = Boolean(crop.finalLabel);
                          return (
                            <button
                              type="button"
                              key={crop.cropId}
                              onClick={() => setSelectedCrop(crop)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px', marginBottom: '6px', textAlign: 'left', cursor: 'pointer',
                                border: isSelected ? '2px solid #495057' : '1px solid #e9ecef',
                                borderRadius: '6px', background: isSelected ? '#f0f4f8' : '#fff',
                              }}
                            >
                              <AuthImage
                                src={imageUrl.crop(crop.filename)}
                                alt={`Cell ${index + 1}`}
                                style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #dee2e6', background: '#f8f9fa', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#343a40' }}>Cell #{index + 1}</div>
                                <div style={{ marginTop: '3px', fontSize: '11px', color: '#6c757d' }}>{crop.totalAnswers}개 학생 응답</div>
                              </div>
                              <div style={{
                                flexShrink: 0, padding: '4px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                                color: hasGroundTruth ? '#155724' : '#6c757d',
                                background: hasGroundTruth ? '#d4edda' : '#e9ecef',
                              }}>
                                {hasGroundTruth ? `GT: ${crop.finalLabel}` : 'GT 미설정'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* 오른쪽: Cell Classification Panel */}
                  <div style={{ flex: 1, minWidth: '350px' }}>
                    <h3 style={sectionHeader}>Cell Classification Panel</h3>
                    {selectedCrop ? (
                      <div style={cellPanelStyle}>
                        {/* 셀 이미지 */}
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
                            <button
                              type="button"
                              aria-label="이전 세포"
                              onClick={() => selectCropAt(selectedCropIndex - 1)}
                              disabled={selectedCropIndex <= 0}
                              style={{ ...professorCellNavBtn, opacity: selectedCropIndex <= 0 ? 0.3 : 1, cursor: selectedCropIndex <= 0 ? 'not-allowed' : 'pointer' }}
                            >
                              ◀
                            </button>
                            <AuthImage src={imageUrl.crop(selectedCrop.filename)} alt="Selected Cell" style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #dee2e6', background: '#fff' }} />
                            <button
                              type="button"
                              aria-label="다음 세포"
                              onClick={() => selectCropAt(selectedCropIndex + 1)}
                              disabled={selectedCropIndex < 0 || selectedCropIndex >= stats.length - 1}
                              style={{ ...professorCellNavBtn, opacity: selectedCropIndex < 0 || selectedCropIndex >= stats.length - 1 ? 0.3 : 1, cursor: selectedCropIndex < 0 || selectedCropIndex >= stats.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              ▶
                            </button>
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#495057', fontWeight: '600' }}>
                            Cell #{selectedCropIndex + 1} / {stats.length}
                          </div>
                          {displaySmearFilename(selectedCrop) !== '-' && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6c757d', wordBreak: 'break-all' }}>
                              Smear: {displaySmearFilename(selectedCrop)}
                            </div>
                          )}
                        </div>

                        {/* 투표 분포 */}
                        <div style={{ marginTop: '20px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '10px' }}>
                            📊 Student Vote Distribution ({selectedCrop.totalAnswers} responses)
                          </div>
                          <VoteBar
                            key={`votes-${selectedCrop.cropId}`}
                            voteDistribution={selectedCrop.voteDistribution}
                            votersByLabel={selectedCrop.votersByLabel}
                            totalAnswers={selectedCrop.totalAnswers}
                          />
                        </div>

                        {/* 정답률 */}
                        <div style={{ marginTop: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#495057' }}>Student Accuracy:</span>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: getAccuracyColor(selectedCrop.accuracyRate, selectedCrop.totalAnswers) }}>
                              {selectedCrop.finalLabel && selectedCrop.totalAnswers > 0 ? `${selectedCrop.accuracyRate}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Ground Truth 확정 */}
                        <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#856404', marginBottom: '10px' }}>
                            🎯 Set Ground Truth (Professor Only)
                          </div>
                          {selectedCrop.finalLabel && !editingGt ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, color: '#155724', background: '#d4edda', padding: '10px', borderRadius: '6px' }}>
                                ✅ Confirmed: <strong>{selectedCrop.finalLabel}</strong>
                              </div>
                              <button onClick={() => setEditingGt(true)} style={editGtBtn}>수정</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <select id={`gt_${selectedCrop.cropId}`} defaultValue={selectedCrop.finalLabel || selectedCrop.gtLabel || CELL_KEYS[0]} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}>
                                {CELL_KEYS.map(label => <option key={label} value={label}>{label}</option>)}
                              </select>
                              <button onClick={() => handleConfirmLabel(selectedCrop.cropId, document.getElementById(`gt_${selectedCrop.cropId}`).value)} style={confirmBtn}>
                                {selectedCrop.finalLabel ? '저장' : 'Confirm'}
                              </button>
                              {selectedCrop.finalLabel && (
                                <button onClick={() => setEditingGt(false)} style={cancelGtBtn}>취소</button>
                              )}
                            </div>
                          )}
                          {selectedCrop.finalLabel && editingGt && (
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#856404' }}>
                              정답을 바꾸면 이미 제출한 학생들의 채점 결과와 혼동행렬도 함께 갱신됩니다.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ ...cellPanelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#6c757d' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
                          <div>{isDiagnosticTask(selectedAnalyticsTask) ? '왼쪽 목록에서 세포를 선택하세요' : 'Click on a cell in the image to view details'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTaskId && stats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No cells found for this task.</div>
              )}
            </div>
          )}

          {/* ───── Cells 서브탭 ───── */}
          {analyticsSubTab === 'cells' && (
            <div>
              <h3 style={sectionHeader}>All Cells (Sorted by Error Rate)</h3>
              <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
                Total: {allCellStats.length} cells across all tasks
              </p>

              {allCellStats.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  {allCellStats.map((item) => (
                    <div key={item.cropId} style={{
                      background: '#fff', border: `2px solid ${getAccuracyColor(item.accuracyRate, item.totalAnswers)}`,
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s',
                    }} onClick={() => {
                      // Tasks 탭으로 전환 + 해당 Task의 해당 셀 선택
                      setAnalyticsSubTab('tasks');
                      fetchTaskStats(item.taskId || selectedTaskId, item.cropId);
                    }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <AuthImage src={imageUrl.crop(item.filename)} alt="cell" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '5px' }}>
                            Crop #{item.cropId}
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                            {item.finalLabel && item.totalAnswers > 0 ? (
                              <>Error Rate: <strong style={{ color: getAccuracyColor(item.accuracyRate, item.totalAnswers) }}>{item.errorRate}%</strong></>
                            ) : (
                              <span style={{ color: '#adb5bd' }}>Not scored yet</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>Responses: {item.totalAnswers}</div>
                          {displaySmearFilename(item) !== '-' && (
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', wordBreak: 'break-all' }}>
                              Smear: {displaySmearFilename(item)}
                            </div>
                          )}
                          {(item.finalLabel || item.gtLabel) && (
                            <div style={{ fontSize: '11px', color: '#155724', marginTop: '5px', background: '#d4edda', padding: '2px 6px', borderRadius: '3px', display: 'inline-block' }}>
                              ✅ {item.finalLabel || item.gtLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No cells found.</div>
              )}
            
            </div>
          )}
          {/* ==================================================== */}
          {/* [여기에 통째로 복사해서 붙여넣으세요!] */}
          {/* ───── Students 서브탭 (혼동행렬) ───── */}
          {analyticsSubTab === 'students' && (
            <div>
              <h3 style={sectionHeader}>Cumulative Student Matrices</h3>
              {/* 하단: 학생 리스트 & 혼동행렬 테이블 */}
              <div style={{ display: 'flex', gap: '25px', marginTop: '20px' }}>
                
                {/* 왼쪽: 학생 리스트 */}
                <div style={{ flex: '0 0 250px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '15px', color: '#495057' }}>학생 목록</h4>
                  {studentMatrices.length === 0 ? (
                    <div style={{ color: '#adb5bd', fontSize: '14px' }}>학생 데이터가 없습니다.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {studentMatrices.map((student, idx) => (
                        <li 
                          key={idx} 
                          style={{
                            padding: '10px', marginBottom: '8px', borderRadius: '6px', cursor: 'pointer',
                            background: selectedStudent?.studentId === student.studentId ? '#e7f3ff' : '#f8f9fa',
                            border: selectedStudent?.studentId === student.studentId ? '1px solid #74c0fc' : '1px solid #e9ecef',
                          }}
                          onClick={() => setSelectedStudent(student)}
                        >
                          <div style={{ fontWeight: '600', color: selectedStudent?.studentId === student.studentId ? '#0056b3' : '#495057' }}>
                            {student.studentDisplayName || student.studentId}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                            정확도: {student.accuracy}% ({student.totalSolved}문제)
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 오른쪽: 선택된 학생의 혼동행렬 테이블 */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
                  {selectedStudent ? (
                    <div>
                      <h4 style={{ fontWeight: '600', marginBottom: '15px', fontSize: '18px', color: '#495057' }}>
                        [{selectedStudent.studentDisplayName || selectedStudent.studentId}] 학생의 혼동행렬
                      </h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #dee2e6', padding: '10px', background: '#f8f9fa', width: '120px' }}>GT \ 응답</th>
                              {CELL_KEYS.map(key => (
                                <th key={key} style={{ border: '1px solid #dee2e6', padding: '10px', background: '#f8f9fa', color: '#495057' }}>
                                  {key.substring(0, 3)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CELL_KEYS.map(actual => (
                              <tr key={actual}>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px', fontWeight: 'bold', background: '#f8f9fa', color: '#495057' }}>
                                  {actual}
                                </td>
                                {(() => {
                                  const rowTotal = CELL_KEYS.reduce((sum, predicted) => {
                                    const value = selectedStudent.confusionMatrix?.[actual]?.[predicted] || 0;
                                    return sum + value;
                                  }, 0);

                                  return CELL_KEYS.map(predicted => {
                                    const count = selectedStudent.confusionMatrix?.[actual]?.[predicted] || 0;
                                    const isCorrect = actual === predicted;
                                    const cellStyle = getMatrixCellStyle(count, rowTotal, isCorrect);
                                    const pct = rowTotal > 0 ? Math.round((count / rowTotal) * 100) : 0;
                                    const title = rowTotal > 0
                                      ? `${count} (${pct}%)`
                                      : '0 (0%)';

                                    return (
                                      <td
                                        key={predicted}
                                        title={title}
                                        style={{
                                          border: '1px solid #dee2e6',
                                          padding: '10px',
                                          ...cellStyle,
                                        }}
                                      >
                                        {count}
                                      </td>
                                    );
                                  });
                                })()}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#adb5bd' }}>
                      왼쪽에서 학생을 선택하면 혼동행렬이 표시됩니다.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
          {analyticsSubTab === 'reports' && (
            <div>
              <h3 style={sectionHeader}>Crop Issue Reports</h3>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>사유 필터</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {Object.keys(reportFilters).map((key) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#495057' }}>
                      <input
                        type="checkbox"
                        checked={reportFilters[key]}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>
              {reportLoading ? (
                <div style={{ color: '#6c757d' }}>불러오는 중...</div>
              ) : reportItems.length === 0 ? (
                <div style={{ color: '#adb5bd' }}>신고된 항목이 없습니다.</div>
              ) : (
                (() => {
                  const activeFilters = Object.entries(reportFilters)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => key);
                  const filteredItems = activeFilters.length === 0
                    ? []
                    : reportItems.filter(item => activeFilters.includes(getReportCategory(item.reason)));

                  if (filteredItems.length === 0) {
                    return <div style={{ color: '#adb5bd' }}>해당 사유의 신고가 없습니다.</div>;
                  }

                  return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr>
                        <th style={reportHeadStyle}>이미지</th>
                        <th style={reportHeadStyle}>시간</th>
                        <th style={reportHeadStyle}>학생</th>
                        <th style={reportHeadStyle}>Task</th>
                        <th style={reportHeadStyle}>Crop</th>
                        <th style={reportHeadStyle}>사유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td style={reportCellStyle}>
                            {item.cropFilename ? (
                              <AuthImage
                                src={imageUrl.crop(item.cropFilename)}
                                alt={`Crop ${item.cropId}`}
                                style={reportThumbStyle}
                              />
                            ) : (
                              <div style={{ color: '#adb5bd' }}>N/A</div>
                            )}
                          </td>
                          <td style={reportCellStyle}>{item.createdAt || '-'}</td>
                          <td style={reportCellStyle}>{item.studentId}</td>
                          <td style={reportCellStyle}>#{item.taskId}</td>
                          <td style={reportCellStyle}>#{item.cropId}</td>
                          <td style={reportCellStyle}>{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  );
                })()
              )}
            </div>
          )}
          {/* ==================================================== */}
        </div>
      )}
      
  


      {/* ============= Tab 3: Diagnostic Evaluation ============= */}
      {activeTab === 3 && (
        <div style={boxStyle}>
          <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>Create Diagnostic Evaluation</h2>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            GT 셀 데이터셋에서 원하는 문제 수와 클래스 분포를 지정해 진단평가 과제를 생성합니다.
          </p>

          {diagnosticLoading && <div style={{ color: '#6c757d' }}>데이터셋 통계를 불러오는 중...</div>}

          {!diagnosticLoading && poolStats && (
            <div>
              <div style={{ marginBottom: '15px', padding: '12px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                <strong>총 사용 가능 셀:</strong> {maxTotalQuestions}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: '600' }}>전체 문제 수</label>
                <input
                  type="number"
                  min={1}
                  max={maxTotalQuestions}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: '140px', padding: '8px', border: '1px solid #ced4da', borderRadius: '6px' }}
                />
                <button onClick={handleAutoDistribute} style={confirmBtn}>자동 분배</button>
                <span style={{ color: isDistributionValid ? '#28a745' : '#dc3545', fontSize: '13px' }}>
                  분포 합계: {distributionTotal} / 목표: {Number(totalQuestions) || 0}
                </span>
              </div>

              <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                {CELL_KEYS.map((label) => {
                  const max = Number(availableByClass[label] || 0);
                  return (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '170px 130px 1fr', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: '600' }}>{label}</div>
                      <input
                        type="number"
                        min={0}
                        max={max}
                        value={classDistribution[label] || 0}
                        onChange={(e) => handleDistributionChange(label, e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '6px' }}
                      />
                      <div style={{ color: '#6c757d', fontSize: '13px' }}>최대 {max}개</div>
                    </div>
                  );
                })}
              </div>

              {diagnosticError && (
                <div style={{ background: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7', borderRadius: '8px', padding: '10px', marginBottom: '15px' }}>
                  {diagnosticError}
                </div>
              )}

              {diagnosticResult && (
                <div style={successBox}>
                  ✅ <strong>Success!</strong> Diagnostic Task #{diagnosticResult.taskId} created with <strong>{diagnosticResult.totalDetected}</strong> cells.
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={handleCreateDiagnosticTask}
                  disabled={!canCreateDiagnostic}
                  style={canCreateDiagnostic ? btnActive : btnDisabled}
                >
                  {diagnosticCreating ? 'Creating...' : '🧪 Create Diagnostic Task'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────── Styles ──────────────── */
const containerStyle = { maxWidth: '1600px', width: '95%', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif', color: '#343a40' };

const tabBar = { display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '25px' };
const tabActive = { padding: '12px 24px', background: '#343a40', color: '#fff', border: '1px solid #343a40', fontWeight: '600', cursor: 'pointer' };
const tabInactive = { padding: '12px 24px', background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6', borderBottom: 'none', cursor: 'pointer' };

const boxStyle = { background: '#f8f9fa', border: '1px solid #dee2e6', padding: '25px', borderRadius: '4px' };
const successBox = { background: '#d4edda', color: '#155724', padding: '10px', marginTop: '15px', border: '1px solid #c3e6cb', fontSize: '14px' };
const btnActive = { padding: '8px 16px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' };
const btnDisabled = { padding: '8px 16px', background: '#adb5bd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'not-allowed', fontWeight: '600' };
const fieldErrorStyle = { marginTop: '6px', fontSize: '13px', color: '#dc3545', fontWeight: '500' };

const subTabBar = { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #dee2e6', paddingBottom: '15px' };
const subTabActive = { padding: '10px 20px', background: '#495057', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' };
const subTabInactive = { padding: '10px 20px', background: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

const sectionHeader = { fontSize: '16px', fontWeight: '600', color: '#495057', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e9ecef' };
const taskBtnStyle = { padding: '12px 18px', background: '#fff', border: '2px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', minWidth: '100px' };

const cellPanelStyle = { background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' };
const confirmBtn = { background: '#495057', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' };
const editGtBtn = { background: '#fff', color: '#856404', padding: '8px 16px', border: '1px solid #ffc107', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 };
const cancelGtBtn = { background: '#fff', color: '#6c757d', padding: '8px 14px', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 };
const professorPanelHeader = { background: '#495057', color: '#fff', padding: '12px 16px', fontSize: '15px', fontWeight: '600' };
const professorCellNavBtn = { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #dee2e6', background: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const labelingToolsStyle = { marginBottom: '18px', padding: '14px 16px', border: '1px solid #b6d4fe', borderRadius: '8px', background: '#eef6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' };
const labelingActionStyle = { display: 'inline-flex', alignItems: 'center', padding: '9px 13px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };

const reportHeadStyle = { borderBottom: '2px solid #dee2e6', padding: '10px', background: '#f8f9fa', fontWeight: '600', color: '#495057' };
const reportCellStyle = { borderBottom: '1px solid #dee2e6', padding: '10px', color: '#495057' };
const reportThumbStyle = { width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' };

const dropZoneStyle = { border: '3px dashed #ced4da', borderRadius: '12px', padding: '40px 20px', cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '20px' };
