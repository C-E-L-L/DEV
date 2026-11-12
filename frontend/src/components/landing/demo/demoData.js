// Data for the hero demos (professor publishes a task / student solves it).
//
// Image + boxes: smear 1000_22 from data/diagnostic_gt (same asset and box transform as the login screen).
// `label` is the expert ground truth from processed/manifest.json, in the same order as the boxes.
// `ai` / `confidence` and the student's answers are ILLUSTRATIVE values for the animation only.
import smear22 from '../../../assets/login/smear-1000_22.jpg';
import smear152 from '../../../assets/login/smear-1000_152.jpg';
import smear410 from '../../../assets/login/smear-1000_410.jpg';

export const DEMO_IMAGE = smear22;
export const DEMO_IMAGE_RATIO = 16 / 10;

export const DEMO_TASK = {
  title: '개 말초혈액 백혈구 분류 #3',
  species: '개 (Canine)',
  fileName: 'smear_1000_22.jpg',
};

export const DEMO_FILES = [
  { name: 'smear_1000_22.jpg', src: smear22 },
  { name: 'smear_1000_152.jpg', src: smear152 },
  { name: 'smear_1000_410.jpg', src: smear410 },
];

/** box = [x, y, w, h] in % of the image. */
export const DEMO_CELLS = [
  { box: [2.7, 45.1, 10.3, 16.1], label: 'Segment', ai: 'Segment', confidence: 96 },
  { box: [78.0, 27.8, 9.9, 19.3], label: 'Eosinophil', ai: 'Eosinophil', confidence: 93 },
  // Classic Band ↔ Segment confusion: the AI is unsure, the expert corrects it.
  { box: [8.0, 63.6, 9.3, 16.3], label: 'Band', ai: 'Segment', confidence: 58 },
  { box: [16.4, 40.5, 10.5, 15.8], label: 'Segment', ai: 'Segment', confidence: 95 },
  { box: [46.2, 33.7, 10.1, 16.0], label: 'Segment', ai: 'Segment', confidence: 91 },
  { box: [53.1, 39.3, 9.0, 16.4], label: 'Monocyte', ai: 'Monocyte', confidence: 88 },
  { box: [39.2, 44.3, 8.6, 14.0], label: 'Lymphocyte', ai: 'Lymphocyte', confidence: 94 },
  { box: [64.1, 76.6, 8.6, 12.6], label: 'Lymphocyte', ai: 'Lymphocyte', confidence: 90 },
];

/** Index of the cell the expert reviews and corrects. */
export const REVIEW_INDEX = 2;

/** The student's answers (one Band ↔ Segment mistake on cell #3). */
export const STUDENT_ANSWERS = DEMO_CELLS.map((cell, index) => (index === REVIEW_INDEX ? 'Segment' : cell.label));

/** How many cells the student answers on screen before the demo fast-forwards. */
export const STUDENT_SHOWN_ANSWERS = 3;

// ---------------------------------------------------------------------------------------------
// DS–MAP aggregation demo (KCC 2026 study; empirical study with real student answers in progress).
// All numbers below are ILLUSTRATIVE. MapDemo computes the posteriors from them with the MAP rule
//   ŷ = argmax_m [ log P(m) + Σ_i log C_i[m, a_i] ]
// over the same 6 classes as the paper, with structured confusion on Band–Seg and Band–Mono.

/** Class order for the matrices and bars below. */
export const MAP_CLASSES = ['Band', 'Segment', 'Lymphocyte', 'Monocyte', 'Eosinophil', 'NucleatedRBC'];
export const MAP_SHORT = { Band: 'Band', Segment: 'Seg', Lymphocyte: 'Lym', Monocyte: 'Mono', Eosinophil: 'Eos', NucleatedRBC: 'nRBC' };

/** The cell being aggregated: cell #3 of the demo smear (expert label: Band). */
export const MAP_CELL_INDEX = REVIEW_INDEX;

/** AI class probabilities, used as the prior P(m). Sums to 1. */
export const MAP_AI_PRIOR = { Band: 0.36, Segment: 0.55, Lymphocyte: 0.02, Monocyte: 0.05, Eosinophil: 0.01, NucleatedRBC: 0.01 };

/**
 * C[true][answer] estimated by Dawid–Skene, rows in MAP_CLASSES order (each row sums to 1).
 * The novice row for Band carries the structured confusion: Band → Seg 0.50, Band → Mono 0.20.
 */
export const MAP_CONFUSION = {
  expert: [
    [0.88, 0.07, 0.01, 0.02, 0.01, 0.01],
    [0.04, 0.92, 0.01, 0.01, 0.01, 0.01],
    [0.01, 0.01, 0.93, 0.03, 0.01, 0.01],
    [0.03, 0.01, 0.03, 0.91, 0.01, 0.01],
    [0.01, 0.03, 0.01, 0.01, 0.93, 0.01],
    [0.01, 0.01, 0.04, 0.01, 0.01, 0.92],
  ],
  novice: [
    [0.25, 0.50, 0.02, 0.20, 0.02, 0.01],
    [0.08, 0.80, 0.03, 0.05, 0.03, 0.01],
    [0.02, 0.03, 0.75, 0.08, 0.02, 0.10],
    [0.10, 0.06, 0.10, 0.70, 0.02, 0.02],
    [0.03, 0.12, 0.02, 0.03, 0.78, 0.02],
    [0.02, 0.02, 0.15, 0.03, 0.02, 0.76],
  ],
};

/** Cells to outline in the novice matrix (structured confusion from the paper). */
export const MAP_STRUCTURED = [['Band', 'Segment'], ['Band', 'Monocyte']];

export const MAP_STUDENTS = [
  { name: '학생 1', type: 'novice', answer: 'Segment' },
  { name: '학생 2', type: 'novice', answer: 'Segment' },
  { name: '학생 3', type: 'expert', answer: 'Band' },
  { name: '학생 4', type: 'novice', answer: 'Monocyte' },
  { name: '학생 5', type: 'novice', answer: 'Segment' },
  { name: '학생 6', type: 'expert', answer: 'Band' },
];
