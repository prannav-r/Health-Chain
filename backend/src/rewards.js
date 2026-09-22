/**
 * Wellness Rewards Calculation Engine
 * 
 * Rules:
 * - Steps >= 10,000: +100 points
 * - Sleep >= 7 hours: +50 points
 * - Both conditions: +150 points
 * - Ineligible / unverified activity: 0 points
 */

export const REWARD_RULES = {
  stepsThreshold: 10000,
  stepsPoints: 100,
  sleepThresholdHours: 7.0,
  sleepPoints: 50
};

/**
 * Calculate wellness reward points for a day's validation result.
 * @param {object} dayValidation 
 * @returns {object} { points, eligible, breakdown, reasons }
 */
export function calculateWellnessReward(dayValidation) {
  if (!dayValidation || !dayValidation.validated || !dayValidation.consensusMetrics) {
    return {
      points: 0,
      eligible: false,
      breakdown: {
        stepsBonus: 0,
        sleepBonus: 0
      },
      reasons: dayValidation?.reasons || ['Health data is unvalidated or inconsistent across sources']
    };
  }

  const { steps, sleepHours } = dayValidation.consensusMetrics;
  let stepsBonus = 0;
  let sleepBonus = 0;
  const reasons = [];

  if (steps >= REWARD_RULES.stepsThreshold) {
    stepsBonus = REWARD_RULES.stepsPoints;
  } else {
    reasons.push(
      `Steps (${steps.toLocaleString()}) fell below ${REWARD_RULES.stepsThreshold.toLocaleString()} daily target`
    );
  }

  if (sleepHours >= REWARD_RULES.sleepThresholdHours) {
    sleepBonus = REWARD_RULES.sleepPoints;
  } else {
    reasons.push(
      `Sleep duration (${sleepHours}h) fell below ${REWARD_RULES.sleepThresholdHours}h target`
    );
  }

  const totalPoints = stepsBonus + sleepBonus;

  return {
    points: totalPoints,
    eligible: totalPoints > 0,
    breakdown: {
      stepsBonus,
      sleepBonus
    },
    reasons: totalPoints === 0 ? reasons : []
  };
}
