export const CELL_TYPES = [
  { key: "Segment", label: "Segment" },
  { key: "Band", label: "Band" },
  { key: "Eosinophil", label: "Eosinophil" },
  { key: "NucleatedRBC", label: "Nucleated RBC" },
  { key: "Lymphocyte", label: "Lymphocyte" },
  { key: "Monocyte", label: "Monocyte" },
];

export const CELL_KEYS = CELL_TYPES.map(c => c.key);

export const REPORT_REASONS = [
  "이미지 잘림",
  "세포 없는 영역 탐지",
  "화질 문제",
  "헷갈림",
  "기타",
];

export const imageUrl = {
  original: (filename) => `/data/originals/${filename}`,
  crop: (filename) => `/data/crops/${filename}`,
  thumbnail: (filename) => `/data/thumbnails/${filename}`,
};
