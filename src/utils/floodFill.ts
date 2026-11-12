/**
 * High-performance 4-way scanline flood fill for canvas coloring books.
 * Designed to preserve black outlines while filling enclosed regions cleanly.
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Checks if a pixel in the line art is a dark boundary line.
 */
export function isLineArtBorder(r: number, g: number, b: number, a: number, threshold = 80): boolean {
  if (a < 80) return false;
  // If brightness is low and opacity is high, it's black outline
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return brightness < threshold;
}

/**
 * Determines if two colors are within a given Manhattan distance tolerance.
 */
export function colorsMatch(
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number,
  tolerance = 32
): boolean {
  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance &&
    Math.abs(a1 - a2) <= tolerance
  );
}

/**
 * Converts a hex color string (#RRGGBB) to RGBA object.
 */
export function hexToRgba(hex: string, alpha = 255): RGBA {
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return { r, g, b, a: alpha };
}

/**
 * Pure flood fill implementation operating directly on ImageData / Uint8ClampedArray.
 * Returns the number of pixels modified.
 */
export function floodFillImageData(
  colorData: ImageData,
  lineArtData: ImageData,
  startX: number,
  startY: number,
  fillColor: RGBA,
  tolerance = 35
): number {
  const width = colorData.width;
  const height = colorData.height;

  startX = Math.floor(startX);
  startY = Math.floor(startY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return 0;
  }

  const colorPixels = colorData.data;
  const linePixels = lineArtData.data;

  let actualStartX = startX;
  let actualStartY = startY;
  let startIdx = (actualStartY * width + actualStartX) * 4;

  // If clicked directly on a line-art border, probe nearby pixels for child-friendly tolerance
  if (isLineArtBorder(linePixels[startIdx], linePixels[startIdx + 1], linePixels[startIdx + 2], linePixels[startIdx + 3])) {
    let found = false;
    const probeRadius = 6;
    for (let r = 1; r <= probeRadius && !found; r++) {
      const probeOffsets = [
        { dx: r, dy: 0 }, { dx: -r, dy: 0 }, { dx: 0, dy: r }, { dx: 0, dy: -r },
        { dx: r, dy: r }, { dx: -r, dy: -r }, { dx: r, dy: -r }, { dx: -r, dy: r },
      ];
      for (const off of probeOffsets) {
        const px = startX + off.dx;
        const py = startY + off.dy;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const pIdx = (py * width + px) * 4;
          if (!isLineArtBorder(linePixels[pIdx], linePixels[pIdx + 1], linePixels[pIdx + 2], linePixels[pIdx + 3])) {
            actualStartX = px;
            actualStartY = py;
            startIdx = pIdx;
            found = true;
            break;
          }
        }
      }
    }
    if (!found) return 0;
  }
  startX = actualStartX;
  startY = actualStartY;

  const startR = colorPixels[startIdx];
  const startG = colorPixels[startIdx + 1];
  const startB = colorPixels[startIdx + 2];
  const startA = colorPixels[startIdx + 3];

  // If the target is already the fill color, return early
  if (colorsMatch(startR, startG, startB, startA, fillColor.r, fillColor.g, fillColor.b, fillColor.a, 4)) {
    return 0;
  }

  // Use a flat Uint8Array visited map to prevent infinite loops and memory allocations
  const visited = new Uint8Array(width * height);
  // Queue for coordinates (packed x + y * width)
  const queue: number[] = [startX + startY * width];
  visited[startX + startY * width] = 1;

  let pixelsChanged = 0;
  const maxPixels = width * height;

  while (queue.length > 0 && pixelsChanged < maxPixels) {
    const current = queue.pop()!;
    const cx = current % width;
    const cy = Math.floor(current / width);
    const idx = current * 4;

    // Apply color to target pixel
    colorPixels[idx] = fillColor.r;
    colorPixels[idx + 1] = fillColor.g;
    colorPixels[idx + 2] = fillColor.b;
    colorPixels[idx + 3] = fillColor.a;
    pixelsChanged++;

    // Check 4 neighbors (Up, Down, Left, Right)
    const neighbors = [
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 },
    ];

    for (const nb of neighbors) {
      if (nb.x < 0 || nb.x >= width || nb.y < 0 || nb.y >= height) continue;

      const nbPos = nb.x + nb.y * width;
      if (visited[nbPos]) continue;

      const nbIdx = nbPos * 4;

      // Check if neighbor is a line-art boundary
      if (isLineArtBorder(linePixels[nbIdx], linePixels[nbIdx + 1], linePixels[nbIdx + 2], linePixels[nbIdx + 3])) {
        visited[nbPos] = 1;
        continue;
      }

      // Check if neighbor matches starting color in color canvas
      const nR = colorPixels[nbIdx];
      const nG = colorPixels[nbIdx + 1];
      const nB = colorPixels[nbIdx + 2];
      const nA = colorPixels[nbIdx + 3];

      if (colorsMatch(nR, nG, nB, nA, startR, startG, startB, startA, tolerance)) {
        visited[nbPos] = 1;
        queue.push(nbPos);
      }
    }
  }

  return pixelsChanged;
}
