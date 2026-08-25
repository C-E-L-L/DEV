const assert = require("node:assert/strict");
const geometry = require("../static/roi_geometry.js");

const letterboxed = geometry.computeViewTransform(1000, 500, 80, 80, 1, 0, 0);
assert.equal(letterboxed.fitScale, 6.25);
assert.equal(letterboxed.offsetX, 250);
assert.equal(letterboxed.offsetY, 0);

const canvasPoint = geometry.imageToCanvas({ x: 40, y: 32 }, letterboxed);
assert.deepEqual(canvasPoint, { x: 500, y: 200 });
assert.deepEqual(
  geometry.canvasToImage(canvasPoint, letterboxed, 80, 80, true),
  { x: 40, y: 32 },
);

const zoomed = geometry.computeViewTransform(900, 700, 80, 80, 3.5, 37, -24);
const original = { x: 17, y: 63 };
const zoomedCanvasPoint = geometry.imageToCanvas(original, zoomed);
assert.deepEqual(
  geometry.canvasToImage(zoomedCanvasPoint, zoomed, 80, 80, true),
  original,
);

assert.deepEqual(
  geometry.canvasToImage({ x: -500, y: 5000 }, letterboxed, 80, 80, true),
  { x: 0, y: 79 },
);

const polygon = [
  { x: 10, y: 10 },
  { x: 60, y: 10 },
  { x: 60, y: 60 },
  { x: 10, y: 60 },
];
assert.equal(geometry.pointInPolygon({ x: 30, y: 30 }, polygon), true);
assert.equal(geometry.pointInPolygon({ x: 70, y: 30 }, polygon), false);
assert.equal(geometry.distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 3);

const movedPolygon = geometry.translateRegionWithinBounds(
  { id: "p", shape: "polygon", points: [[10, 10], [20, 10], [20, 20]] },
  15,
  -30,
  80,
  80,
);
assert.equal(movedPolygon.dx, 15);
assert.equal(movedPolygon.dy, -10);
assert.deepEqual(movedPolygon.region.points, [[25, 0], [35, 0], [35, 10]]);

const movedEllipse = geometry.translateRegionWithinBounds(
  { id: "e", shape: "ellipse", cx: 60, cy: 60, rx: 10, ry: 8 },
  50,
  50,
  80,
  80,
);
assert.equal(movedEllipse.dx, 9);
assert.equal(movedEllipse.dy, 11);
assert.equal(movedEllipse.region.cx, 69);
assert.equal(movedEllipse.region.cy, 71);

console.log("ROI geometry tests passed");
