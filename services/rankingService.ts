export interface Need {
  id: string;
  label: string;
  category?: string;
  emergency?: boolean;
}

export interface UserNeedStats {
  frequency: number;
  lastUsed: number;
}

export interface UserStatsMap {
  [needId: string]: UserNeedStats;
}

export interface UserContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  lastSelectedNeedCategory?: string | null; 
}

export interface ScoredNeed extends Need {
  score: number;
}

// ------------------------------------------------------------------------------------------------------------------------------
// Time of day to need category mapping
const TIME_CATEGORY_MAP: Record<string, string[]> = {
  morning:   ["hygiene", "breakfast", "medication", "comfort"],
  afternoon: ["food", "entertainment", "physio", "drink"],
  evening:   ["dinner", "family", "comfort", "relaxation"],
  night:     ["sleep", "pain", "bathroom", "medication"],
};

// ------------------------------------------------------------------------------------------------------------------------------
// Sequential follow up mapping after selecting category X, boost these categories
const FOLLOW_UP_CATEGORY_MAP: Record<string, string[]> = {
  greeting:      ["comfort", "entertainment", "family"],
  pain:          ["medication", "bathroom", "comfort"],
  food:          ["drink", "comfort"],
  drink:         ["comfort", "bathroom"],
  medication:    ["comfort", "sleep"],
  physio:        ["comfort", "pain", "drink"],
  bathroom:      ["hygiene", "comfort"],
  entertainment: ["comfort", "family"],
  hygiene:       ["comfort", "clothing"],
};

// ------------------------------------------------------------------------------------------------------------------------------
// Main Ranking Function
export function rankNeeds(
  needs: Need[],
  userStats: UserStatsMap,
  context: UserContext,
  topN: number = 5
): ScoredNeed[] {
  const now = Date.now();

  const scored: ScoredNeed[] = needs.map((need) => {
    const stats = userStats[need.id];

    const freqScore    = calculateFrequencyScore(stats);
    const recencyScore = calculateRecencyScore(stats, now);
    const contextScore = calculateContextScore(need, context);

    const score =
      0.5 * freqScore +
      0.3 * recencyScore +
      0.2 * contextScore;

    return { ...need, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// ------------------------------------------------------------------------------------------------------------------------------
// Frequency Score: log scale 0 to 1
function calculateFrequencyScore(stats?: UserNeedStats): number {
  if (!stats || stats.frequency <= 0) return 0;
  const maxExpectedFrequency = 20;
  return Math.min(
    Math.log1p(stats.frequency) / Math.log1p(maxExpectedFrequency),
    1
  );
}

// ------------------------------------------------------------------------------------------------------------------------------
// Recency Score, Exponential Decay 0 to 1
function calculateRecencyScore(stats: UserNeedStats | undefined, now: number): number {
  if (!stats || !stats.lastUsed) return 0;
  const timeDiff = now - stats.lastUsed;
  const decayConstant = 1000 * 60 * 60 * 24; // 1 day
  return Math.exp(-timeDiff / decayConstant);
}

// ------------------------------------------------------------------------------------------------------------------------------
// Context Score 0 to 1, 3 types added
function calculateContextScore(need: Need, context: UserContext): number {
  let score = 0;

  // 1: Emergency always to top
  if (need.emergency) score += 1;

  // 2: Time of day 
  const timeRelevantCategories = TIME_CATEGORY_MAP[context.timeOfDay] ?? [];
  if (need.category && timeRelevantCategories.includes(need.category)) {
    score += 0.5;
  }

  // 3: Sequential follow up boost
  if (context.lastSelectedNeedCategory && need.category) {
    const followUps = FOLLOW_UP_CATEGORY_MAP[context.lastSelectedNeedCategory] ?? [];
    if (followUps.includes(need.category)) score += 0.4;
  }

  return Math.min(score, 1);
}

// ------------------------------------------------------------------------------------------------------------------------------
// get Time Of Day
export function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}