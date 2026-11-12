// Landing page copy. Text edits only need to touch this file.

/** Where the header / CTA login buttons go. Change to '/login' once the landing replaces '/'. */
export const LOGIN_PATH = '/';

export const NAV_LINKS = [
  { id: 'about', label: '서비스 소개' },
  { id: 'pipeline', label: '데이터 순환 구조' },
  { id: 'features', label: '주요 기능' },
  { id: 'research', label: '학술 연구 성과' },
];

export const HERO = {
  badge: '수의학 교육과 AI 라벨링의 혁신적 연결',
  badgeAside: '수의 혈액학 교육 및 AI 세포 라벨링 플랫폼',
  titleLines: ['정밀 혈액 도말 분석과'],
  titleAccent: '지능형 AI 라벨링',
  titleTail: '의 새로운 기준',
  lead: '실제 동물 환자의 혈액 도말 영상으로 백혈구 분류를 실습하고, AI가 검출한 세포를 교수자가 검증해 신뢰할 수 있는 라벨 데이터로 축적합니다.',
  demoCaption: '화면 예시: 실제 진단평가 도말 영상으로 재구성한 사용 흐름입니다. AI 신뢰도와 학생 응답은 예시 값입니다.',
  partners: '공동 연구기관: 경상국립대학교 수의과대학 · 충북대학교 소프트웨어학부',
};

export const FEATURES = {
  eyebrow: '실습 중심 핵심 역량',
  title: '실제 세포를 관찰하고, 스스로 분류합니다.',
  desc: '단순 암기식 사진 교육에서 벗어나 실제 도말 영상을 탐색하며 세포를 직접 분류하고, 결과 피드백으로 감별 능력을 키웁니다.',
  items: [
    {
      icon: 'microscope',
      title: '실제 영상 기반 실습',
      desc: '수의학 혈액도말의 실제 고화질 영상을 확대/축소하며 백혈구를 분류합니다.',
      tag: '종(species)별 세포 클래스 구성',
    },
    {
      icon: 'book',
      title: '점수와 오답 복습',
      desc: '실습 결과를 바탕으로 오답 패턴(예: Band vs Segmented neutrophil)을 확인하고 형태학적 감별점을 복습합니다.',
      tag: '혼동행렬 기반 피드백',
    },
    {
      icon: 'barChart',
      title: '학생별 학습 현황',
      desc: '학습 진행률, 세포별 정확도, 과제 결과를 대시보드에서 확인해 학생별 성취도를 관리합니다.',
      tag: '교수자용 분석 화면',
    },
  ],
};

export const PIPELINE = {
  eyebrow: 'Continuous Learning Pipeline',
  titleLead: '배움이 데이터가 되고, 데이터가 ',
  titleAccent: 'AI',
  titleTail: '를 키웁니다.',
  desc: '실습에서 모인 수의대생의 응답을 수의 임상병리 전문가가 검증하여 신뢰할 수 있는 라벨 데이터로 축적합니다.',
  // Who does each step (colors + legend).
  actors: {
    professor: '교수·전문가',
    ai: 'AI',
    student: '학생',
    data: '데이터',
  },
  // Brackets above the flow; `span` = number of steps they cover, in order.
  groups: [
    { label: '과제 준비', span: 3 },
    { label: '학습', span: 1 },
    { label: '검증 · 축적', span: 2 },
  ],
  steps: [
    { actor: 'professor', icon: 'upload', title: '도말 이미지 업로드', desc: '과제에 쓸 도말 이미지와 동물 종을 선택해 올립니다.' },
    { actor: 'ai', icon: 'sparkles', title: 'AI 세포 검출 · 분류', desc: '세포 위치를 찾고, 세포 종류와 신뢰도를 예측합니다.', chips: ['YOLOv8', 'DenseNet-201'] },
    { actor: 'professor', icon: 'userCheck', title: '전문가 검토 · 게시', desc: 'AI 결과를 검토해 라벨을 확정·수정하고 과제로 게시합니다.' },
    { actor: 'student', icon: 'laptop', title: '학생 독립 분류', desc: '정답과 AI 예측 없이 세포를 분류하고, 채점 결과와 오답을 복습합니다.' },
    { actor: 'professor', icon: 'layers', title: '응답 집계 · 라벨 확정', desc: '세포별 학생 응답 분포와 오류 양상을 검토해 기준 라벨을 확정합니다.', research: 'DS–MAP 실증 연구 진행 중' },
    { actor: 'data', icon: 'database', title: '라벨 데이터셋 축적', desc: '확정된 라벨이 동물 종 정보, 원본 영상 좌표와 함께 쌓입니다.' },
  ],
  // Dashed return arrow (last step → AI step). Retraining is not implemented yet, so it is marked as future work.
  loop: { badge: '향후 연구', text: '검수된 라벨 데이터로 AI 모델 개선' },
  // DS–MAP demo shown under the diagram: a closer look at step 05.
  map: {
    tag: 'STEP 05 자세히 보기',
    title: '학생 응답이 하나의 라벨이 되기까지',
    caption: 'DS–MAP 집계 연구는 논문(KCC 2026)으로 발표했으며, 현재 실제 학생 응답으로 실증 연구를 진행 중입니다. 화면의 학생 응답·혼동행렬·확률은 예시 값입니다.',
  },
};

// Files live in frontend/public/research/ (served as /research/...).
// `pages` are the images shown in the viewer modal (PDF pages pre-rendered to WebP, since mobile
// browsers cannot show a PDF inside a modal); `file` is the original that the download button saves.
const R = '/research';
export const RESEARCH = {
  eyebrow: 'Academic Validation',
  title: '교육 현장과 연구를 함께 연결합니다.',
  desc: 'CELL 플랫폼과 학생 응답 기반 라벨 집계 연구를 국내 학술대회에서 발표했습니다.',
  items: [
    {
      icon: 'award',
      venue: 'KCC 2026',
      venueAside: '한국컴퓨터종합학술대회 · 논문집 pp. 2054–2056',
      title: 'Dawid–Skene 기반 MAP 추론을 이용한 다중클래스 라벨 추정 성능 비교',
      authors: '최현준, 서한빛, 오홍석, 이의종 (충북대학교 소프트웨어학부)',
      desc: '비전문가(학생) 분류 응답을 Dawid–Skene 기반 MAP 추론으로 집계하는 방법을 시뮬레이션으로 평가했습니다. 구조적 혼동, 클래스 불균형, 전문가가 포함된 라벨러 환경에서 단순 다수결보다 안정적인 성능을 보였습니다.',
      docs: [
        {
          label: '논문', icon: 'fileText', file: `${R}/kcc2026-paper.pdf`, downloadName: 'KCC2026_DS-MAP_논문.pdf',
          pages: [1, 2, 3].map((n) => `${R}/pages/kcc2026-paper-${n}.webp`),
        },
        {
          label: '포스터', icon: 'award', file: `${R}/kcc2026-poster.pdf`, downloadName: 'KCC2026_DS-MAP_포스터.pdf',
          pages: [`${R}/pages/kcc2026-poster-1.webp`],
        },
      ],
    },
    {
      icon: 'fileText',
      venue: '한국발생생물학회',
      venueAside: 'Dev. Reprod. Vol 30, 2026 (Suppl. 1) · C-21 · 포스터 발표',
      title: '학생 참여형 혈액세포 형태학 교육과 라벨 데이터 축적을 통합한 Human-in-the-Loop 웹 플랫폼 개발',
      authors: '최현준, 김주훈, 배현아, 송지혜, 안세정, 이의종 (충북대학교 소프트웨어학부, 경상국립대학교 수의과대학)',
      desc: '학생이 정답과 AI 예측 없이 세포를 분류하고, 교수·전문가가 응답 분포를 검토해 기준 라벨을 확정하는 C.E.L.L. 플랫폼을 소개했습니다. DS 기반 MAP 추론으로 의사 라벨을 집계하는 실증 분석 계획도 함께 제시했습니다.',
      docs: [
        {
          label: '초록', icon: 'fileText', file: `${R}/ksdb2026-abstract.png`, downloadName: '한국발생생물학회2026_CELL_초록.png',
          pages: [`${R}/ksdb2026-abstract.png`],
        },
        {
          label: '포스터', icon: 'award', file: `${R}/ksdb2026-poster.pdf`, downloadName: '한국발생생물학회2026_CELL_포스터.pdf',
          pages: [`${R}/pages/ksdb2026-poster-1.webp`],
        },
      ],
    },
  ],
};

export const CTA = {
  title: '다음 실습, CELL에서 시작하세요.',
  desc: '경상국립대, 충북대 및 파트너 대학 수의학과 학생이라면 발급받은 계정으로 바로 실습실에 입장할 수 있습니다.',
  button: 'CELL 실습실 입장',
};

export const FOOTER = {
  tagline: 'Collaborative Education & Labeling Loop',
  institutions: ['경상국립대학교 수의과대학', '충북대학교 소프트웨어학부'],
  status: 'AI 세포 검출 · 분류 서비스',
  copyright: `© ${new Date().getFullYear()} CELL Veterinary Lab Platform. All rights reserved. 본 시스템에 활용된 혈액 도말 영상 저작권은 해당 대학에 있습니다.`,
  links: ['개인정보처리방침', '이용약관'],
};
