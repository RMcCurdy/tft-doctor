/**
 * Explanation Generator
 *
 * Produces human-readable fit explanations for recommendation cards.
 */

import type { FitScoreResult } from "./fit-score";

export function generateExplanation(
  fit: FitScoreResult,
  compName: string
): string[] {
  const explanations: string[] = [];

  // Include all specific reasons from scoring
  for (const reason of fit.reasons) {
    explanations.push(reason);
  }

  // Add confidence context based on score
  if (fit.score >= 75) {
    explanations.push(`${compName} is an excellent fit for your current game state`);
  } else if (fit.score >= 50) {
    explanations.push(`${compName} is a solid option with your inputs`);
  } else if (fit.score < 30 && explanations.length <= 1) {
    explanations.push(
      `${compName} is a meta comp but doesn't strongly synergize with your current items/emblems`
    );
  }

  return explanations;
}
