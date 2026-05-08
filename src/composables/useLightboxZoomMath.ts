export type Size = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Pan = {
  x: number;
  y: number;
};

export type ClampPanOptions = {
  stageSize: Size;
  imageBaseSize: Size;
  zoom: number;
  pan: Pan;
};

export type FocalZoomOptions = {
  stageSize: Size;
  imageBaseSize: Size;
  currentZoom: number;
  nextZoom: number;
  currentPan: Pan;
  focalPoint: Point;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getContainedSize(options: {
  container: Size;
  natural: Size;
}): Size {
  const containerWidth = Math.max(1, options.container.width);
  const containerHeight = Math.max(1, options.container.height);
  const naturalWidth = Math.max(1, options.natural.width);
  const naturalHeight = Math.max(1, options.natural.height);

  const containerRatio = containerWidth / containerHeight;
  const naturalRatio = naturalWidth / naturalHeight;

  if (!Number.isFinite(containerRatio) || !Number.isFinite(naturalRatio)) {
    return { width: containerWidth, height: containerHeight };
  }

  if (naturalRatio > containerRatio) {
    return {
      width: containerWidth,
      height: containerWidth / naturalRatio,
    };
  }

  return {
    width: containerHeight * naturalRatio,
    height: containerHeight,
  };
}

export function getPanBounds(options: {
  stageSize: Size;
  imageBaseSize: Size;
  zoom: number;
}) {
  const zoomedWidth = options.imageBaseSize.width * options.zoom;
  const zoomedHeight = options.imageBaseSize.height * options.zoom;

  const overflowX = Math.max(0, zoomedWidth - options.stageSize.width);
  const overflowY = Math.max(0, zoomedHeight - options.stageSize.height);

  return {
    minX: -overflowX / 2,
    maxX: overflowX / 2,
    minY: -overflowY / 2,
    maxY: overflowY / 2,
  };
}

export function clampPan(options: ClampPanOptions): Pan {
  if (options.zoom <= 1) {
    return { x: 0, y: 0 };
  }

  const bounds = getPanBounds(options);

  return {
    x: clamp(options.pan.x, bounds.minX, bounds.maxX),
    y: clamp(options.pan.y, bounds.minY, bounds.maxY),
  };
}

export function getFocalZoomPan(options: FocalZoomOptions): Pan {
  const {
    stageSize,
    imageBaseSize,
    currentZoom,
    nextZoom,
    currentPan,
    focalPoint,
  } = options;

  if (nextZoom <= 1) {
    return { x: 0, y: 0 };
  }

  const safeCurrentZoom = Math.max(0.001, currentZoom);
  const stageCenter = {
    x: stageSize.width / 2,
    y: stageSize.height / 2,
  };

  const focalFromCenter = {
    x: focalPoint.x - stageCenter.x,
    y: focalPoint.y - stageCenter.y,
  };

  const zoomRatio = nextZoom / safeCurrentZoom;
  const nextPan = {
    x: focalFromCenter.x - (focalFromCenter.x - currentPan.x) * zoomRatio,
    y: focalFromCenter.y - (focalFromCenter.y - currentPan.y) * zoomRatio,
  };

  return clampPan({
    stageSize,
    imageBaseSize,
    zoom: nextZoom,
    pan: nextPan,
  });
}
