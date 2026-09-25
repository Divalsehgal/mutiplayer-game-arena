const COLUMN_WIDTH = 110;
const ROW_HEIGHT = 130;

/**
 * Converts grid coordinates to canvas pixels. Nodes use a top-centre origin,
 * so `col` places the node's horizontal centre.
 */
export const at = (col: number, row: number) => ({
  x: col * COLUMN_WIDTH,
  y: row * ROW_HEIGHT,
});
