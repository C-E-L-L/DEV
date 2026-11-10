import { CELL_TYPES } from '../constants.js';

export function cellChoices(item) {
  return item?.classLabels ? Object.entries(item.classLabels).map(([key,label]) => ({key,label})) : CELL_TYPES;
}
export function answerLabel(label) { return label === 'UNKNOWN' ? '모르겠어요' : label; }
