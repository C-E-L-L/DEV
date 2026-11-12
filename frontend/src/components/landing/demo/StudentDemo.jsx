import Icon from '../../login/icons';
import { CELL_TYPES } from '../../../constants';
import CellZoom from './CellZoom';
import DemoWindow from './DemoWindow';
import useDemoTimeline from './useDemoTimeline';
import {
  DEMO_CELLS, DEMO_IMAGE, DEMO_TASK, REVIEW_INDEX, STUDENT_ANSWERS, STUDENT_SHOWN_ANSWERS,
} from './demoData';

// One loop ≈ 12 s. The student answers the first few cells on screen, then the demo fast-forwards.
const STEPS = [
  { id: 'list', phase: 'open', duration: 1600, target: 'start-btn', click: true },
  ...Array.from({ length: STUDENT_SHOWN_ANSWERS }, (_, i) => ({
    id: `solve-${i}`, phase: 'solve', duration: 1300, target: `class-${STUDENT_ANSWERS[i]}`, click: true, cell: i,
  })),
  { id: 'done', phase: 'solve', duration: 1100, target: 'submit-btn', cell: DEMO_CELLS.length - 1 },
  { id: 'submit', phase: 'solve', duration: 900, target: 'submit-btn', click: true, cell: DEMO_CELLS.length - 1 },
  { id: 'result', phase: 'result', duration: 3800, target: 'mistake-row' },
];

const PHASE_LABELS = { open: '과제 열기', solve: '세포 분류', result: '채점 · 오답 복습' };

const labelOf = (key) => CELL_TYPES.find((c) => c.key === key)?.label || key;

function TaskList() {
  return (
    <div className="sd-list">
      <p className="sd-list__heading">내 과제</p>
      <div className="sd-task is-new">
        <span className="sd-task__badge">NEW</span>
        <div>
          <strong>{DEMO_TASK.title}</strong>
          <span>{DEMO_TASK.species} · 세포 {DEMO_CELLS.length}개 · 마감 D-3</span>
        </div>
        <span className="sd-btn" data-demo-target="start-btn">풀이 시작</span>
      </div>
      <div className="sd-task is-done">
        <div>
          <strong>개 말초혈액 백혈구 분류 #2</strong>
          <span>제출 완료 · 채점 결과 확인 가능</span>
        </div>
        <span className="sd-chip">완료</span>
      </div>
      <div className="sd-task is-done">
        <div>
          <strong>진단평가 · 백혈구 감별 기초</strong>
          <span>제출 완료</span>
        </div>
        <span className="sd-chip">완료</span>
      </div>
    </div>
  );
}

function Solve({ step }) {
  const current = step.cell ?? 0;
  const answered = step.id === 'done' || step.id === 'submit' ? DEMO_CELLS.length : current;
  const allDone = answered === DEMO_CELLS.length;
  const picking = step.id.startsWith('solve-') ? STUDENT_ANSWERS[current] : null;

  return (
    <div className="sd-solve">
      <div className="sd-image">
        <img src={DEMO_IMAGE} alt="" />
        {DEMO_CELLS.map((cell, i) => {
          const [x, y, w, h] = cell.box;
          return (
            <span
              key={cell.box.join()}
              className={`sd-box${i === current && !allDone ? ' is-current' : ''}${i < answered ? ' is-answered' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
            >
              <em>{i < answered ? <Icon name="check" size={9} /> : i + 1}</em>
            </span>
          );
        })}
      </div>

      <aside className="sd-panel">
        <p className="sd-panel__progress">
          <span>{allDone ? '모든 세포 응답 완료' : `세포 ${current + 1}`}</span>
          <strong>{answered} / {DEMO_CELLS.length}</strong>
        </p>
        <span className="sd-bar"><i style={{ width: `${(answered / DEMO_CELLS.length) * 100}%` }} /></span>
        <CellZoom cell={DEMO_CELLS[current]} size={128} />
        <p className="sd-panel__hint">정답과 AI 예측은 제출 전까지 보이지 않습니다</p>
        <div className="sd-classes">
          {CELL_TYPES.map((type) => (
            <span
              key={type.key}
              className={`sd-class${picking === type.key ? ' is-picking' : ''}`}
              data-demo-target={`class-${type.key}`}
            >
              {type.label}
            </span>
          ))}
        </div>
        <span className={`sd-btn sd-btn--block${allDone ? '' : ' is-disabled'}`} data-demo-target="submit-btn">제출하기</span>
      </aside>
    </div>
  );
}

function Result() {
  const correct = STUDENT_ANSWERS.filter((answer, i) => answer === DEMO_CELLS[i].label).length;
  const percent = Math.round((correct / DEMO_CELLS.length) * 1000) / 10;
  const mistake = DEMO_CELLS[REVIEW_INDEX];
  return (
    <div className="sd-result">
      <div className="sd-score">
        <span className="sd-score__ring" style={{ '--p': percent }}>
          <strong>{percent}%</strong>
        </span>
        <p><strong>{correct} / {DEMO_CELLS.length}</strong> 정답</p>
        <span className="sd-chip sd-chip--ok">제출 완료</span>
      </div>
      <div className="sd-review">
        <p className="sd-review__heading">오답 복습</p>
        <div className="sd-mistake" data-demo-target="mistake-row">
          <CellZoom cell={mistake} size={92} />
          <div>
            <span className="sd-mistake__num">세포 {REVIEW_INDEX + 1}</span>
            <p>
              내 답 <s>{labelOf(STUDENT_ANSWERS[REVIEW_INDEX])}</s>
              <Icon name="arrowRight" size={11} />
              정답 <strong>{labelOf(mistake.label)}</strong>
            </p>
            <span className="sd-mistake__tip">핵의 잘록한 정도(분엽 여부)를 다시 확인해 보세요.</span>
          </div>
        </div>
        <p className="sd-review__pair">
          <span>자주 헷갈린 조합</span>
          <strong>Band ↔ Segment</strong>
        </p>
        <p className="sd-review__note"><Icon name="info" size={12} />제출한 응답은 교수의 라벨 검토에 함께 활용됩니다.</p>
      </div>
    </div>
  );
}

export default function StudentDemo() {
  const timeline = useDemoTimeline(STEPS, { posterStep: STEPS.findIndex((s) => s.id === 'solve-2') });
  const { step } = timeline;
  const view = step.id === 'list' ? <TaskList /> : step.id === 'result' ? <Result /> : <Solve step={step} />;

  return (
    <DemoWindow
      timeline={timeline}
      role="학생"
      roleTone="student"
      title="과제 풀이"
      description="게시된 과제를 열어 정답과 AI 예측 없이 세포를 분류하고, 제출 후 채점 결과와 오답을 복습합니다."
      phaseLabels={PHASE_LABELS}
      compactHeight={510}
    >
      {view}
    </DemoWindow>
  );
}
