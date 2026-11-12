import Icon from '../../login/icons';
import { CELL_TYPES } from '../../../constants';
import DemoWindow from './DemoWindow';
import useDemoTimeline from './useDemoTimeline';
import { DEMO_CELLS, DEMO_FILES, DEMO_IMAGE, DEMO_TASK, REVIEW_INDEX } from './demoData';

// One loop ≈ 17 s. `target` = element the cursor moves to, `click` = cursor clicks it at the end.
const STEPS = [
  { id: 'form', phase: 'upload', duration: 1400, target: 'image-select', click: true },
  { id: 'open', phase: 'upload', duration: 1400, target: 'file-0', click: true },
  { id: 'selected', phase: 'upload', duration: 1100, target: 'upload-btn', click: true },
  { id: 'uploading', phase: 'upload', duration: 1300, target: 'upload-btn' },
  { id: 'detecting', phase: 'detect', duration: 2800, target: 'status' },
  { id: 'classifying', phase: 'classify', duration: 2400, target: 'status' },
  { id: 'review', phase: 'review', duration: 1400, target: `row-${REVIEW_INDEX}`, click: true },
  { id: 'reviewOpen', phase: 'review', duration: 1500, target: 'option-Band', click: true },
  { id: 'reviewed', phase: 'publish', duration: 1500, target: 'publish-btn', click: true },
  { id: 'published', phase: 'publish', duration: 2400, target: 'publish-btn' },
];

const PHASE_LABELS = { upload: '이미지 업로드', detect: '세포 검출', classify: 'AI 분류', review: '전문가 검증', publish: '과제 게시' };

const labelOf = (key) => CELL_TYPES.find((c) => c.key === key)?.label || key;
// Short hematology abbreviations for the tags drawn on the image (full names are in the list).
const SHORT = { Segment: 'Seg', Band: 'Band', Lymphocyte: 'Lym', Monocyte: 'Mono', Eosinophil: 'Eos', NucleatedRBC: 'nRBC' };

function UploadForm({ step, reached }) {
  const chosen = reached('selected');
  return (
    <div className="pd-form">
      <p className="pd-form__heading"><Icon name="fileText" size={14} />새 과제 만들기</p>
      <label className="pd-field">
        <span>과제명</span>
        <span className="pd-input">{DEMO_TASK.title}</span>
      </label>
      <label className="pd-field">
        <span>동물 종</span>
        <span className="pd-input pd-input--select">{DEMO_TASK.species}<Icon name="chevronDown" size={13} /></span>
      </label>
      <div className="pd-field">
        <span>도말 이미지</span>
        <span className={`pd-input pd-input--select${step.id === 'open' ? ' is-focused' : ''}`} data-demo-target="image-select">
          {chosen
            ? <><img src={DEMO_FILES[0].src} alt="" className="pd-thumb" />{DEMO_FILES[0].name}</>
            : <span className="pd-placeholder">이미지를 선택하세요</span>}
          <Icon name="chevronDown" size={13} />
        </span>
        {step.id === 'open' && (
          <ul className="pd-menu">
            {DEMO_FILES.map((file, i) => (
              <li key={file.name} data-demo-target={`file-${i}`}>
                <img src={file.src} alt="" className="pd-thumb" />{file.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className={`pd-btn${chosen ? '' : ' is-disabled'}`} data-demo-target="upload-btn">
        <Icon name="upload" size={13} />업로드 후 AI 분석
      </span>
      {step.id === 'uploading' && (
        <div className="pd-progress"><span /><em>업로드 중 · {DEMO_TASK.fileName}</em></div>
      )}
    </div>
  );
}

function Analysis({ step, reached }) {
  const detecting = step.id === 'detecting';
  const classified = reached('classifying');
  const reviewed = reached('reviewed');
  const reviewing = step.id === 'review' || step.id === 'reviewOpen';

  return (
    <div className="pd-analysis">
      <div className="pd-image">
        <img src={DEMO_IMAGE} alt="" />
        {detecting && <span className="pd-scan" />}
        {DEMO_CELLS.map((cell, i) => {
          const [x, y, w, h] = cell.box;
          const flagged = i === REVIEW_INDEX && classified && !reviewed;
          const label = i === REVIEW_INDEX && reviewed ? cell.label : cell.ai;
          return (
            <span
              key={cell.box.join()}
              className={`pd-box${flagged ? ' is-flagged' : ''}${reviewed ? ' is-verified' : ''}${reviewing && i === REVIEW_INDEX ? ' is-focus' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, animationDelay: `${0.25 + i * 0.28}s` }}
            >
              {classified && <em className="pd-box__tag" style={{ animationDelay: `${i * 0.18}s` }}>{SHORT[label] || label}</em>}
            </span>
          );
        })}
      </div>

      <aside className="pd-side">
        <p className="pd-status" data-demo-target="status">
          {detecting
            ? <><span className="pd-spinner" />AI 세포 검출 중…</>
            : <><Icon name="sparkles" size={13} />{classified ? 'AI 분류 완료' : '검출 완료'} · 세포 {DEMO_CELLS.length}개</>}
        </p>
        <ol className="pd-rows">
          {DEMO_CELLS.map((cell, i) => {
            const isReview = i === REVIEW_INDEX;
            const fixed = isReview && reviewed;
            return (
              <li
                key={cell.box.join()}
                className={`pd-row${isReview && classified && !reviewed ? ' is-flagged' : ''}${isReview && reviewing ? ' is-focus' : ''}`}
                data-demo-target={`row-${i}`}
              >
                <span className="pd-row__num">{i + 1}</span>
                {classified ? (
                  <>
                    <span className="pd-row__label">{labelOf(fixed ? cell.label : cell.ai)}</span>
                    <span className={`pd-row__conf${cell.confidence < 70 && !fixed ? ' is-low' : ''}${fixed ? ' is-fixed' : ''}`}>
                      {fixed ? '수정' : `${cell.confidence}%`}
                    </span>
                    <span className="pd-row__state">
                      {reviewed
                        ? <Icon name="check" size={12} />
                        : isReview ? '검토' : <Icon name="check" size={12} />}
                    </span>
                  </>
                ) : (
                  <span className="pd-row__skeleton" />
                )}
              </li>
            );
          })}
        </ol>

        {step.id === 'reviewOpen' && (
          <div className="pd-options">
            <span className="pd-options__title">전문가 라벨 확정</span>
            {CELL_TYPES.map((type) => (
              <span key={type.key} className={`pd-option${type.key === 'Band' ? ' is-pick' : ''}`} data-demo-target={`option-${type.key}`}>
                {type.label}
              </span>
            ))}
          </div>
        )}

        <div className="pd-side__foot">
          <span>{reviewed ? `검증 완료 ${DEMO_CELLS.length}/${DEMO_CELLS.length}` : classified ? '검토 필요 1건' : '분류 대기'}</span>
          <span className={`pd-btn pd-btn--sm${reviewed ? '' : ' is-disabled'}`} data-demo-target="publish-btn">과제 게시</span>
        </div>
      </aside>

      {step.id === 'published' && (
        <div className="pd-toast"><Icon name="check" size={14} />과제가 학생에게 게시되었습니다</div>
      )}
    </div>
  );
}

export default function ProfessorDemo() {
  const timeline = useDemoTimeline(STEPS, { posterStep: STEPS.findIndex((s) => s.id === 'reviewOpen') });
  const { step, reached } = timeline;

  return (
    <DemoWindow
      timeline={timeline}
      role="교수"
      roleTone="professor"
      title="과제 출제"
      description="도말 이미지를 업로드하면 AI가 세포를 검출·분류하고, 전문가가 검토해 확정한 뒤 과제로 게시합니다."
      phaseLabels={PHASE_LABELS}
      compactHeight={570}
    >
      {reached('detecting') ? <Analysis step={step} reached={reached} /> : <UploadForm step={step} reached={reached} />}
    </DemoWindow>
  );
}
