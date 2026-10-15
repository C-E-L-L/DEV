import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { taskApi, statsApi, cropApi, reportApi, labelingApi, speciesApi } from '../api';
import { CELL_KEYS, REPORT_REASONS, imageUrl } from '../constants';
import AuthImage from './AuthImage';
import ImageDisplayControls, { useImageDisplaySettings } from './ImageDisplayControls';
import { fetchAuthImage } from '../utils/fetchAuthImage';
import SpeciesBadge from './SpeciesBadge';
import TaskSpeciesEditor from './TaskSpeciesEditor';
import StudentResponsesPanel from './StudentResponsesPanel';
import StudentManagement from './StudentManagement';

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

function isDiagnosticTask(task) {
  return !task?.originalFilename || (task?.uploadedFilename || '').startsWith('diagnostic-');
}

function getReportCategory(reason) {
  const normalized = (reason || '').trim();
  if (REPORT_REASONS.includes(normalized)) return normalized;
  return '기타';
}

export default function AnalyticsFeedback() {
  const [analyticsSubTab, setAnalyticsSubTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [taskPanelView, setTaskPanelView] = useState('cells');
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);
  const [taskStatsError, setTaskStatsError] = useState('');
  const taskStatsRequestRef = useRef(0);
  const [editingGt, setEditingGt] = useState(false);
  const [allCellStats, setAllCellStats] = useState([]);
  const [gtProgressStatus, setGtProgressStatus] = useState('idle');
  const [reportItems, setReportItems] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState(
    () => Object.fromEntries(REPORT_REASONS.map((reason) => [reason, true]))
  );

  const canvasRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [species, setSpecies] = useState([]);
  useEffect(() => {
    speciesApi.getAll().then(({ data }) => setSpecies(data || [])).catch(console.error);
    return () => { taskStatsRequestRef.current += 1; };
  }, []);

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
  const imageDisplay = useImageDisplaySettings(selectedAnalyticsTask?.originalFilename || `task-${selectedTaskId || 'none'}`);

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

  useEffect(() => {
    taskApi.getAll().then(({ data }) => setTasks(data)).catch(console.error);
    refreshAllCellStats();
  }, [refreshAllCellStats]);

  useEffect(() => {
    if (analyticsSubTab !== 'reports') return;
    setReportLoading(true);
    reportApi.getAll()
      .then(({ data }) => setReportItems(data || []))
      .catch(() => setReportItems([]))
      .finally(() => setReportLoading(false));
  }, [analyticsSubTab]);

  const fetchTaskStats = useCallback(async (taskId, preferredCropId = null) => {
    const requestId = ++taskStatsRequestRef.current;
    setSelectedTaskId(taskId);
    setSelectedCrop(null);
    setStats([]);
    setTaskPanelView('cells');
    setTaskStatsLoading(true);
    setTaskStatsError('');
    setOriginalImage(null);
    setImageLoaded(false);
    try {
      const { data } = await statsApi.getByTaskId(taskId);
      if (requestId !== taskStatsRequestRef.current) return;
      setStats(data);
      setSelectedCrop(data.find(crop => crop.cropId === preferredCropId) || data[0] || null);

      const task = tasks.find(t => t.id === taskId) || (await taskApi.getAll()).data.find(t => t.id === taskId);
      if (requestId !== taskStatsRequestRef.current) return;
      if (task?.originalFilename) {
        fetchAuthImage(imageUrl.original(task.originalFilename))
          .then(url => {
            if (requestId !== taskStatsRequestRef.current) { URL.revokeObjectURL(url); return; }
            const img = new Image();
            img.onload = () => {
              URL.revokeObjectURL(url);
              if (requestId !== taskStatsRequestRef.current) return;
              setOriginalImage(img);
              setImageLoaded(true);
            };
            img.onerror = () => URL.revokeObjectURL(url);
            img.src = url;
          })
          .catch(() => {});
      }
    } catch (error) {
      if (requestId !== taskStatsRequestRef.current) return;
      setStats([]);
      setSelectedCrop(null);
      setTaskStatsError('도말 분석 정보를 불러오지 못했습니다.');
    } finally {
      if (requestId === taskStatsRequestRef.current) setTaskStatsLoading(false);
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

    ctx.filter = imageDisplay.filter;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

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
  }, [analyticsSubTab, originalImage, imageLoaded, stats, selectedCrop, imageDisplay.filter]);

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

  const refreshTasks = async () => {
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
      const task = tasks.find(item => item.id === taskId);
      link.download = `task_${taskId}_${(task?.speciesCode || 'DOG').toLowerCase()}_labeling.zip`;
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

  return (
        <div style={boxStyle}>
          {/* 서브탭 */}
          <div style={subTabBar}>
            <button onClick={() => setAnalyticsSubTab('tasks')} style={analyticsSubTab === 'tasks' ? subTabActive : subTabInactive}>📋 Tasks</button>
            <button onClick={() => setAnalyticsSubTab('cells')} style={analyticsSubTab === 'cells' ? subTabActive : subTabInactive}>🔬 Cells</button>
            <button onClick={() => setAnalyticsSubTab('students')} style={analyticsSubTab === 'students' ? subTabActive : subTabInactive}>🧑‍🎓 Students</button>
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
                        <div key={task.id} style={{
                          ...taskBtnStyle,
                          ...(selectedTaskId === task.id ? { background: '#495057', color: '#fff', borderColor: '#495057' } : {}),
                          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', minWidth: '180px',
                        }}>
                          <button type="button" onClick={() => fetchTaskStats(task.id)} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
                            padding: 0, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer',
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
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                            <TaskSpeciesEditor
                              taskId={task.id}
                              species={species}
                              value={task.speciesId}
                              onUpdated={refreshTasks}
                            />
                          </div>
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
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                            {Array.from(new Map(group.tasks.map(task => [task.speciesCode || `species-${task.speciesId}`, task])).values()).map(task => (
                              <SpeciesBadge key={task.speciesCode || task.speciesId} name={task.speciesName} code={task.speciesCode} compact />
                            ))}
                          </div>
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
                          <SpeciesBadge name={task.speciesName} code={task.speciesCode} compact style={{ marginTop: '5px' }} />
                        </div>
                        <DeadlineControl
                          deadlineAt={task.deadlineAt}
                          onSave={(deadlineAt) => handleUpdateDeadline('task', task.id, deadlineAt)}
                        />
                        <TaskSpeciesEditor
                          taskId={task.id}
                          species={species}
                          value={task.speciesId}
                          onUpdated={refreshTasks}
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
                                     <SpeciesBadge name={task.speciesName} code={task.speciesCode} compact style={{ marginTop: '5px' }} />
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
                    <div style={{ ...sectionHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span>Blood Smear Image</span>
                      <ImageDisplayControls settings={imageDisplay.settings} onChange={imageDisplay.updateSetting} onReset={imageDisplay.resetSettings} />
                    </div>
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
                                style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #dee2e6', background: '#f8f9fa', flexShrink: 0, filter: imageDisplay.filter }}
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
                    <div style={{ ...sectionHeader, display: 'flex', gap: '8px' }} role="group" aria-label="도말 분석 메뉴">
                      {[['cells', '세포 분석'], ['students', '학생별 응답']].map(([view, label]) => (
                        <button key={view} type="button" aria-pressed={taskPanelView === view} onClick={() => setTaskPanelView(view)} style={{
                          padding: '8px 14px', borderRadius: '6px', border: `1px solid ${taskPanelView === view ? '#0056b3' : '#dee2e6'}`,
                          background: taskPanelView === view ? '#0056b3' : '#fff', color: taskPanelView === view ? '#fff' : '#495057',
                          cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                        }}>{label}</button>
                      ))}
                    </div>
                    {taskPanelView === 'students' ? (
                      <StudentResponsesPanel key={selectedTaskId} crops={stats} selectedCrop={selectedCrop} onSelectCrop={setSelectedCrop} imageFilter={imageDisplay.filter} smearFilename={selectedCrop ? displaySmearFilename(selectedCrop) : '-'} />
                    ) : selectedCrop ? (
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
                            <AuthImage src={imageUrl.crop(selectedCrop.filename)} alt="Selected Cell" style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #dee2e6', background: '#fff', filter: imageDisplay.filter }} />
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
                          <SpeciesBadge name={selectedCrop.speciesName} code={selectedCrop.speciesCode} compact style={{ marginTop: '6px' }} />
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
                            🎯 Set Ground Truth
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

              {selectedTaskId && taskStatsLoading && (
                <div role="status" style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>도말 분석 정보를 불러오는 중입니다.</div>
              )}
              {selectedTaskId && taskStatsError && (
                <div role="alert" style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                  {taskStatsError}
                  <button type="button" onClick={() => fetchTaskStats(selectedTaskId)} style={{ marginLeft: '12px', cursor: 'pointer' }}>다시 시도</button>
                </div>
              )}
              {selectedTaskId && !taskStatsLoading && !taskStatsError && stats.length === 0 && (
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
                           <SpeciesBadge name={item.speciesName} code={item.speciesCode} compact style={{ marginBottom: '5px' }} />
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
          {/* 학생별 학습 이력 및 누적 혼동행렬 */}
          {analyticsSubTab === 'students' && <StudentManagement />}
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
                        <th style={reportHeadStyle}>동물 종</th>
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
                          <td style={reportCellStyle}><SpeciesBadge name={item.speciesName} code={item.speciesCode} compact /></td>
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
  );
}

const boxStyle = { background: '#f8f9fa', border: '1px solid #dee2e6', padding: '25px', borderRadius: '4px' };
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
