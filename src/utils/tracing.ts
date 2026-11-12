export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates Euclidean distance between two points.
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Evaluates tracing accuracy between user strokes and guide points.
 * For each guide point, checks if at least one user stroke point is within toleranceRadius.
 * Returns percentage (0 to 100) and stars earned (0 to 3).
 */
export function calculateTracingScore(
  userPoints: Point[],
  guidePoints: Point[],
  toleranceRadius = 36
): { accuracy: number; stars: number; completed: boolean } {
  if (guidePoints.length === 0) {
    return { accuracy: 100, stars: 3, completed: true };
  }
  if (userPoints.length === 0) {
    return { accuracy: 0, stars: 0, completed: false };
  }

  let matchedGuideCount = 0;

  for (const guide of guidePoints) {
    let matched = false;
    for (const userPt of userPoints) {
      if (getDistance(userPt, guide) <= toleranceRadius) {
        matched = true;
        break;
      }
    }
    if (matched) {
      matchedGuideCount++;
    }
  }

  const accuracy = Math.round((matchedGuideCount / guidePoints.length) * 100);

  let stars = 0;
  if (accuracy >= 85) {
    stars = 3;
  } else if (accuracy >= 65) {
    stars = 2;
  } else if (accuracy >= 45) {
    stars = 1;
  }

  const completed = accuracy >= 50;

  return { accuracy, stars, completed };
}

/**
 * Generates equidistant guide points along simple geometrical paths for tracing.
 */
export function generateLetterGuidePoints(type: string): Point[] {
  // Normalized 100x100 coordinates
  switch (type.toUpperCase()) {
    case 'A':
      return [
        { x: 50, y: 15 },
        { x: 38, y: 40 },
        { x: 26, y: 65 },
        { x: 15, y: 88 },
        { x: 62, y: 40 },
        { x: 74, y: 65 },
        { x: 85, y: 88 },
        { x: 35, y: 58 },
        { x: 50, y: 58 },
        { x: 65, y: 58 },
      ];
    case 'B':
      return [
        { x: 25, y: 15 },
        { x: 25, y: 35 },
        { x: 25, y: 55 },
        { x: 25, y: 75 },
        { x: 25, y: 88 },
        { x: 45, y: 18 },
        { x: 65, y: 32 },
        { x: 45, y: 50 },
        { x: 70, y: 68 },
        { x: 50, y: 88 },
      ];
    case 'C':
      return [
        { x: 75, y: 25 },
        { x: 50, y: 15 },
        { x: 25, y: 35 },
        { x: 20, y: 55 },
        { x: 30, y: 75 },
        { x: 55, y: 88 },
        { x: 78, y: 80 },
      ];
    case 'CIRCLE':
      return [
        { x: 50, y: 15 },
        { x: 75, y: 25 },
        { x: 85, y: 50 },
        { x: 75, y: 75 },
        { x: 50, y: 85 },
        { x: 25, y: 75 },
        { x: 15, y: 50 },
        { x: 25, y: 25 },
      ];
    case 'STAR':
      return [
        { x: 50, y: 12 },
        { x: 62, y: 38 },
        { x: 88, y: 38 },
        { x: 68, y: 56 },
        { x: 75, y: 85 },
        { x: 50, y: 68 },
        { x: 25, y: 85 },
        { x: 32, y: 56 },
        { x: 12, y: 38 },
        { x: 38, y: 38 },
      ];
    case '1':
      return [
        { x: 35, y: 30 },
        { x: 50, y: 15 },
        { x: 50, y: 40 },
        { x: 50, y: 65 },
        { x: 50, y: 85 },
        { x: 30, y: 85 },
        { x: 70, y: 85 },
      ];
    default:
      // Generic curve / line fallback
      return [
        { x: 20, y: 50 },
        { x: 40, y: 30 },
        { x: 60, y: 70 },
        { x: 80, y: 50 },
      ];
  }
}
