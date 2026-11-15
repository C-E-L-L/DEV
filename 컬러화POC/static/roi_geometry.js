(function attachRoiGeometry(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RoiGeometry = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function computeViewTransform(
    viewWidth,
    viewHeight,
    imageWidth,
    imageHeight,
    zoom = 1,
    panX = 0,
    panY = 0,
  ) {
    if (![viewWidth, viewHeight, imageWidth, imageHeight].every((value) => Number(value) > 0)) {
      return { fitScale: 1, scale: 1, offsetX: 0, offsetY: 0 };
    }
    const fitScale = Math.min(viewWidth / imageWidth, viewHeight / imageHeight);
    const scale = fitScale * clamp(Number(zoom) || 1, 0.25, 32);
    return {
      fitScale,
      scale,
      offsetX: (viewWidth - imageWidth * scale) / 2 + (Number(panX) || 0),
      offsetY: (viewHeight - imageHeight * scale) / 2 + (Number(panY) || 0),
    };
  }

  function imageToCanvas(point, transform) {
    return {
      x: transform.offsetX + point.x * transform.scale,
      y: transform.offsetY + point.y * transform.scale,
    };
  }

  function canvasToImage(point, transform, imageWidth, imageHeight, round = true) {
    let x = (point.x - transform.offsetX) / transform.scale;
    let y = (point.y - transform.offsetY) / transform.scale;
    if (round) {
      x = Math.round(x);
      y = Math.round(y);
    }
    return {
      x: clamp(x, 0, Math.max(0, imageWidth - 1)),
      y: clamp(y, 0, Math.max(0, imageHeight - 1)),
    };
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function distanceToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (dx === 0 && dy === 0) return distance(point, start);
    const ratio = clamp(
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
      0,
      1,
    );
    return distance(point, { x: start.x + ratio * dx, y: start.y + ratio * dy });
  }

  function pointInPolygon(point, points) {
    let inside = false;
    for (let current = 0, previous = points.length - 1; current < points.length; previous = current++) {
      const a = points[current];
      const b = points[previous];
      const intersects = ((a.y > point.y) !== (b.y > point.y))
        && (point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || Number.EPSILON) + a.x);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function regionBounds(region) {
    if (region.shape === "polygon") {
      const xs = region.points.map((point) => point[0]);
      const ys = region.points.map((point) => point[1]);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    }
    return {
      minX: region.cx - region.rx,
      maxX: region.cx + region.rx,
      minY: region.cy - region.ry,
      maxY: region.cy + region.ry,
    };
  }

  function translateRegionWithinBounds(region, deltaX, deltaY, imageWidth, imageHeight) {
    const bounds = regionBounds(region);
    const dx = clamp(Math.round(deltaX), -bounds.minX, imageWidth - 1 - bounds.maxX);
    const dy = clamp(Math.round(deltaY), -bounds.minY, imageHeight - 1 - bounds.maxY);
    const translated = { ...region };
    if (region.shape === "polygon") {
      translated.points = region.points.map(([x, y]) => [x + dx, y + dy]);
    } else {
      translated.cx = region.cx + dx;
      translated.cy = region.cy + dy;
    }
    return { region: translated, dx, dy };
  }

  return {
    clamp,
    computeViewTransform,
    imageToCanvas,
    canvasToImage,
    distance,
    distanceToSegment,
    pointInPolygon,
    regionBounds,
    translateRegionWithinBounds,
  };
}));
