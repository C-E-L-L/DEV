export const CELL_TYPES = [
  { key: "Segment", label: "Segment" },
  { key: "Band", label: "Band" },
  { key: "Eosinophil", label: "Eosinophil" },
  { key: "NucleatedRBC", label: "Nucleated RBC" },
  { key: "Lymphocyte", label: "Lymphocyte" },
  { key: "Monocyte", label: "Monocyte" },
];

export const CELL_KEYS = CELL_TYPES.map(c => c.key);

export const imageUrl = {
  original: (filename) => `/data/originals/${filename}`,
  crop: (filename) => `/data/crops/${filename}`,
};
