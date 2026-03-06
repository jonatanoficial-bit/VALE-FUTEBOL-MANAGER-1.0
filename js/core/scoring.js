/*
 * Scoring system. Calculates points and experience for a call based
 * on its case definition, the actual call state, and the outcome of
 * dispatch. Returns an object with points, xp and other deltas.
 */

const severityPoints = {
  prank: 5,
  low: 20,
  medium: 40,
  high: 60,
};

export function computeScore(call, caseDef, dispatchResult) {
  const base = severityPoints[caseDef.baseSeverity] || 10;
  let multiplier = 0;
  switch (dispatchResult.outcome) {
    case 'success':
      multiplier = 1;
      break;
    case 'partial':
      multiplier = 0.5;
      break;
    case 'fail':
      multiplier = -0.5;
      break;
    default:
      multiplier = 0;
  }
  const points = Math.round(base * multiplier);
  const xp = Math.max(0, Math.round((base + points) / 2));
  return { points, xp };
}