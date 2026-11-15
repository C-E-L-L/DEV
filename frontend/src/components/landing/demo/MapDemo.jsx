import Icon from '../../login/icons';
import CellZoom from './CellZoom';
import DemoWindow from './DemoWindow';
import useDemoTimeline from './useDemoTimeline';
import {
  DEMO_CELLS, MAP_AI_PRIOR, MAP_CELL_INDEX, MAP_CLASSES, MAP_CONFUSION, MAP_SHORT, MAP_STRUCTURED, MAP_STUDENTS,
} from './demoData';
import './MapDemo.css';

// ---- Math: 6-class MAP, P(m | answers) ∝ P(m) · Π_i C_i[m, a_i] -------------------------------
const col = (cls) => MAP_CLASSES.indexOf(cls);
const normalize = (v) => { const z = v.reduce((a, b) => a + b, 0); return v.map((x) => x / z); };

/** Posterior over MAP_CLASSES before any answer (= AI prior), then after each student in order. */
const POSTERIOR = MAP_STUDENTS.reduce(
  (acc, s) => {
    const prev = acc[acc.length - 1];
    return [...acc, normalize(prev.map((p, m) => p * MAP_CONFUSION[s.type][m][col(s.answer)]))];
  },
  [normalize(MAP_CLASSES.map((c) => MAP_AI_PRIOR[c]))],
);
const BAND = col('Band');
const FINAL = POSTERIOR[POSTERIOR.length - 1];
const MAP_RESULT = MAP_CLASSES[FINAL.indexOf(Math.max(...FINAL))];
const AI_RESULT = MAP_CLASSES.reduce((best, c) => (MAP_AI_PRIOR[c] > MAP_AI_PRIOR[best] ? c : best));

const VOTES = MAP_STUDENTS.reduce((acc, s) => ({ ...acc, [s.answer]: (acc[s.answer] || 0) + 1 }), {});
const MAJORITY = Object.entries(VOTES).sort((a, b) => b[1] - a[1])[0][0];
const EXPERT_LABEL = DEMO_CELLS[MAP_CELL_INDEX].label;

/** 99.7% must not round to "100%". */
const pct = (p) => (p >= 0.995 && p < 1 ? `${(p * 100).toFixed(1)}%` : `${Math.round(p * 100)}%`);
/** Change in P(Band) caused by student k (1-based), in percentage points. */
const bandDelta = (k) => (POSTERIOR[k][BAND] - POSTERIOR[k - 1][BAND]) * 100;

// ---- Timeline (~19 s) -------------------------------------------------------------------------
const STEPS = [
  { id: 'collect', phase: 'collect', duration: 2600 },
  { id: 'majority', phase: 'majority', duration: 2600 },
  { id: 'ds', phase: 'ds', duration: 3600 },
  ...POSTERIOR.map((_, k) => ({ id: `map-${k}`, phase: 'map', duration: k === 0 ? 1200 : 950, applied: k })),
  { id: 'result', phase: 'result', duration: 4400 },
];
const PHASE_LABELS = { collect: '응답 수집', majority: '단순 다수결', ds: '신뢰도 추정 (DS)', map: 'MAP 추론', result: '결과 · 교수 검토' };

// Wide on desktop, two rows on tablets, stacked on phones.
const STAGES = [
  { name: 'wide', minWidth: 880, w: 960, h: 340 },
  { name: 'medium', minWidth: 520, w: 640, h: 570 },
  { name: 'compact', minWidth: 0, w: 380, h: 720 },
];

const TONE = { Band: 'band', Segment: 'seg' };
function ClassChip({ label, short = false }) {
  return <span className={`md-chip md-chip--${TONE[label] || 'other'}`}>{short ? MAP_SHORT[label] : label}</span>;
}

/** Six horizontal bars (class · bar · %), sorted or in class order. */
function ClassBars({ values, sorted = false, highlight }) {
  const rows = MAP_CLASSES.map((c, i) => ({ c, v: values[i] }));
  if (sorted) rows.sort((a, b) => b.v - a.v);
  return (
    <div className="md-bars">
      {rows.map(({ c, v }) => (
        <div key={c} className={`md-bars__row${highlight === c ? ' is-top' : ''}`}>
          <span>{MAP_SHORT[c]}</span>
          <i><b className={`is-${TONE[c] || 'other'}`} style={{ width: `${Math.max(v * 100, v > 0 ? 1.5 : 0)}%` }} /></i>
          <em>{pct(v)}</em>
        </div>
      ))}
    </div>
  );
}

function CellCard() {
  return (
    <div className="md-card md-cell">
      <div className="md-cell__head">
        <CellZoom cell={DEMO_CELLS[MAP_CELL_INDEX]} size={96} />
        <div>
          <p className="md-label">세포 {MAP_CELL_INDEX + 1}</p>
          <p className="md-cell__note">학생 응답이 갈린 세포</p>
        </div>
      </div>
      <div className="md-prior">
        <p className="md-label">AI 예측 <span>= 사전확률 P(m)</span></p>
        <ClassBars values={MAP_CLASSES.map((c) => MAP_AI_PRIOR[c])} sorted />
      </div>
    </div>
  );
}

function Students({ step, reached }) {
  const showReliability = reached('ds');
  const applied = step.applied ?? -1;
  return (
    <div className="md-card md-students">
      <p className="md-label">학생 응답 {MAP_STUDENTS.length}명</p>
      <ol>
        {MAP_STUDENTS.map((s, i) => {
          const accuracy = MAP_CONFUSION[s.type][BAND][BAND];
          const isApplying = step.phase === 'map' && applied === i + 1;
          const showDelta = step.phase === 'map' && applied >= i + 1;
          const delta = bandDelta(i + 1);
          return (
            <li
              key={s.name}
              className={`md-student${isApplying ? ' is-applying' : ''}`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <span className="md-student__avatar">{i + 1}</span>
              <span className="md-student__name">{s.name}</span>
              <ClassChip label={s.answer} />
              {showReliability && (
                <span className={`md-student__rel md-student__rel--${s.type}`}>
                  <i><b style={{ width: pct(accuracy) }} /></i>
                  {!showDelta && (s.type === 'expert' ? '숙련 · 신뢰도 높음' : '초보 · Band 혼동 잦음')}
                </span>
              )}
              {showDelta && (
                <span className={`md-student__weight md-student__weight--${delta >= 0 ? 'band' : 'seg'}`}>
                  Band {delta >= 0 ? '+' : '−'}{Math.abs(delta).toFixed(0)}%p
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Matrix({ title, rows, tone, structured = [] }) {
  const isStructured = (t, a) => structured.some(([st, sa]) => st === t && sa === a);
  return (
    <div className={`md-matrix md-matrix--${tone}`}>
      <p>{title}</p>
      <table>
        <thead>
          <tr><th aria-label="실제 \ 응답" />{MAP_CLASSES.map((c) => <th key={c}>{MAP_SHORT[c]}</th>)}</tr>
        </thead>
        <tbody>
          {MAP_CLASSES.map((truth, m) => (
            <tr key={truth}>
              <th>{MAP_SHORT[truth]}</th>
              {rows[m].map((v, a) => (
                <td
                  key={MAP_CLASSES[a]}
                  className={`${v >= 0.5 ? 'is-strong' : ''}${isStructured(truth, MAP_CLASSES[a]) ? ' is-structured' : ''}`}
                  style={{ '--v': v, animationDelay: `${(m + a) * 0.03}s` }}
                >
                  {v >= 0.15 ? Math.round(v * 100) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodPanel({ step }) {
  const { phase } = step;

  if (phase === 'collect') {
    return (
      <div className="md-card md-method md-method--idle">
        <Icon name="layers" size={22} />
        <p>6개 클래스로 갈린 학생 응답을<br />어떻게 하나의 라벨로 합칠까요?</p>
      </div>
    );
  }

  if (phase === 'majority') {
    const total = MAP_STUDENTS.length;
    return (
      <div className="md-card md-method">
        <p className="md-label">단순 다수결 <span>모든 학생을 같은 무게로</span></p>
        <div className="md-bars md-bars--votes">
          {MAP_CLASSES.map((c) => (
            <div key={c} className={`md-bars__row${c === MAJORITY ? ' is-top' : ''}`}>
              <span>{MAP_SHORT[c]}</span>
              <i><b className={`is-${TONE[c] || 'other'}`} style={{ width: `${((VOTES[c] || 0) / total) * 100}%` }} /></i>
              <em>{VOTES[c] || 0}표</em>
            </div>
          ))}
        </div>
        <p className="md-verdict md-verdict--seg">다수결 결과 <ClassChip label={MAJORITY} /></p>
      </div>
    );
  }

  if (phase === 'ds') {
    return (
      <div className="md-card md-method">
        <p className="md-label">Dawid–Skene <span>학생별 6×6 혼동행렬 추정</span></p>
        <div className="md-matrices">
          <Matrix title="숙련 학생" rows={MAP_CONFUSION.expert} tone="expert" />
          <Matrix title="초보 학생" rows={MAP_CONFUSION.novice} tone="novice" structured={MAP_STRUCTURED} />
        </div>
        <p className="md-method__text">
          행 = 실제 클래스, 열 = 학생 응답(%). 초보 학생은 Band를 <strong>Seg·Mono로 혼동</strong>하는 구조적 오답 패턴이 있습니다.
        </p>
      </div>
    );
  }

  if (phase === 'map') {
    const k = step.applied;
    const dist = POSTERIOR[k];
    const top = MAP_CLASSES[dist.indexOf(Math.max(...dist))];
    let note = 'AI 예측을 사전확률로 시작합니다.';
    if (k > 0) {
      const s = MAP_STUDENTS[k - 1];
      const d = bandDelta(k);
      note = s.answer !== 'Band' && d > 0
        ? `${s.name}의 ${MAP_SHORT[s.answer]} 응답은 초보 학생의 Band 혼동 패턴과 일치해 오히려 Band 근거가 됩니다.`
        : `${s.name}(${s.type === 'expert' ? '숙련' : '초보'})의 ${MAP_SHORT[s.answer]} 응답을 신뢰도만큼 반영: Band ${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(0)}%p`;
    }
    return (
      <div className="md-card md-method">
        <p className="md-label">MAP 추론 <span>응답 반영 {k} / {MAP_STUDENTS.length}</span></p>
        <p className="md-formula">ŷ = argmax<sub>m</sub> [ log P(m) + Σ<sub>i</sub> log C<sub>i</sub>(m, a<sub>i</sub>) ]</p>
        <ClassBars values={dist} highlight={top} />
        <p className="md-method__text">{note}</p>
      </div>
    );
  }

  // result
  const rows = [
    { method: '단순 다수결', result: MAJORITY, detail: `${VOTES[MAJORITY]}/${MAP_STUDENTS.length}표` },
    { method: 'AI 단독', result: AI_RESULT, detail: pct(MAP_AI_PRIOR[AI_RESULT]) },
    { method: 'DS–MAP', result: MAP_RESULT, detail: pct(Math.max(...FINAL)), highlight: true },
  ];
  return (
    <div className="md-card md-method">
      <p className="md-label">결과 비교 <span>교수 확정 라벨 기준</span></p>
      <table className="md-compare">
        <tbody>
          {rows.map((r) => (
            <tr key={r.method} className={r.highlight ? 'is-highlight' : ''}>
              <th>{r.method}</th>
              <td><ClassChip label={r.result} /></td>
              <td className="md-compare__detail">{r.detail}</td>
              <td className={`md-compare__mark ${r.result === EXPERT_LABEL ? 'is-ok' : 'is-bad'}`}>
                <Icon name={r.result === EXPERT_LABEL ? 'check' : 'close'} size={13} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="md-flag"><Icon name="info" size={13} />AI·다수결과 결과가 달라 <strong>교수 검토 우선</strong> 대상으로 표시</p>
      <p className="md-verdict md-verdict--ok"><Icon name="userCheck" size={14} />교수 확정 <ClassChip label={EXPERT_LABEL} /></p>
    </div>
  );
}

export default function MapDemo() {
  const timeline = useDemoTimeline(STEPS, { posterStep: STEPS.findIndex((s) => s.id === 'ds') });
  const { step, reached } = timeline;

  return (
    <DemoWindow
      timeline={timeline}
      role="연구"
      roleTone="research"
      title="DS–MAP 라벨 집계"
      description="6개 클래스로 갈린 학생 응답을 단순 다수결과 DS–MAP으로 집계해 비교하고, 교수가 최종 라벨을 확정하는 과정입니다."
      phaseLabels={PHASE_LABELS}
      stages={STAGES}
      className="demo--map"
    >
      <div className="md-layout">
        <CellCard />
        <Students step={step} reached={reached} />
        <MethodPanel step={step} />
      </div>
    </DemoWindow>
  );
}
