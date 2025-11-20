import { DSRData, DSRInfo, Outlet, PerformanceInsight, Nudge } from "@/types";

export function classifyPerformance(dsrData: DSRData): PerformanceInsight {
  const targetAchievement = parseFloat(dsrData.target_achievement.replace("%", ""));
  const growthTrend = parseFloat(dsrData.sales_growth_trend.replace("%", ""));

  let status: PerformanceInsight["status"];
  let recommendations: string[];

  if (targetAchievement >= 120 && growthTrend > 10) {
    status = "excellent";
    recommendations = [
      "Maintain your momentum - you're doing great!",
      "Share your best practices with the team",
      "Focus on sustaining high-value relationships",
    ];
  } else if (targetAchievement >= 100 && targetAchievement < 120) {
    status = "good";
    recommendations = [
      "Push for excellence - you're close to top tier",
      "Focus on high-value outlets to maximize impact",
      "Consider cross-selling opportunities",
    ];
  } else if (targetAchievement >= 80 && targetAchievement < 100) {
    status = "needs-attention";
    recommendations = [
      "Increase outlet coverage - you have some missed opportunities",
      "Optimize your SKU mix per outlet type",
      "Review your route efficiency to save time",
    ];
  } else {
    status = "critical";
    recommendations = [
      "Urgent action needed - let's review your strategy",
      "Focus on increasing outlet visits immediately",
      "Prioritize high-value accounts",
      "Let's work on your route planning together",
    ];
  }

  return { status, recommendations, targetAchievement, growthTrend };
}

export function getPriorityOutlets(dsrData: DSRData, outlets: Outlet[]): Outlet[] {
  const scoredOutlets = outlets
    .map((outlet) => ({
      ...outlet,
      priority_score: calculatePriorityScore(outlet, dsrData),
    }))
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
    .slice(0, 5);

  return scoredOutlets;
}

export function calculatePriorityScore(outlet: Outlet, dsrData: DSRData): number {
  let score = 0;

  // High-value outlet
  if (outlet.avg_order_value > 30000) score += 30;
  else if (outlet.avg_order_value > 20000) score += 20;

  // Not visited recently
  const daysSinceVisit = getDaysSince(outlet.last_visit_date);
  if (daysSinceVisit > 14) score += 25;
  else if (daysSinceVisit > 7) score += 15;

  // Festive season opportunity
  if (dsrData.current_festive_season && outlet.type === "Eatery") {
    score += 20;
  }

  // Low competitor presence in area
  if (dsrData.competitor_presence === "Low") {
    score += 15;
  }

  // Strong relationship
  if (outlet.relationship_score > 7) score += 10;
  else if (outlet.relationship_score > 5) score += 5;

  // SMMT accounts are typically higher value
  if (outlet.type === "SMMT") score += 15;

  return score;
}

function getDaysSince(dateString: string): number {
  const lastVisit = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function generateNudge(
  dsrData: DSRData,
  currentTime: Date,
  nearbyOutlets?: Outlet[]
): Nudge | null {
  const hour = currentTime.getHours();

  // Missed outlet nearby
  if (nearbyOutlets && nearbyOutlets.length > 0) {
    const missedOutlet = nearbyOutlets.find(
      (o) => getDaysSince(o.last_visit_date) > 14
    );
    if (missedOutlet) {
      return {
        type: "missed_outlet",
        priority: "high",
        message: `You're near ${missedOutlet.name} - last visited ${getDaysSince(missedOutlet.last_visit_date)} days ago. Good time to stop by!`,
        action: "Navigate to outlet",
        outlet: missedOutlet,
      };
    }
  }

  // Festive season reminder (morning only)
  if (
    dsrData.current_festive_season &&
    hour >= 8 &&
    hour < 12 &&
    dsrData.festival_season_SKUs_to_outlet > 0
  ) {
    return {
      type: "seasonal_opportunity",
      priority: "medium",
      message: `${dsrData.current_festive_season} is approaching! Push festive SKUs today - ${dsrData.festival_season_SKUs_to_outlet} SKUs available.`,
      action: "View festive SKU list",
    };
  }

  // Route efficiency reminder
  if (dsrData.route_efficiency_score < 70 && hour < 12) {
    return {
      type: "efficiency_tip",
      priority: "low",
      message: "Cluster your visits by area to improve route efficiency. Plan your route before heading out!",
      action: "Optimize route",
    };
  }

  return null;
}

export function generateMorningBriefing(
  dsrData: DSRData,
  priorityOutlets: Outlet[],
  persona: "professional" | "friendly" | "motivator" | "advisor"
): string {
  const performance = classifyPerformance(dsrData);
  const targetStr = `${dsrData.target_achievement} of target achieved`;

  let briefing = "";

  switch (persona) {
    case "professional":
      briefing = `Performance Status: ${targetStr}. `;
      briefing += `Growth trend: ${dsrData.sales_growth_trend}. `;
      briefing += `Priority outlets today: ${priorityOutlets.length}. `;
      if (dsrData.current_festive_season) {
        briefing += `Focus on ${dsrData.current_festive_season} promotions. `;
      }
      break;

    case "friendly":
      briefing = `Hey! You're at ${targetStr} - ${performance.status === "excellent" || performance.status === "good" ? "fantastic work" : "let's improve that"}! `;
      briefing += `I've got ${priorityOutlets.length} key outlets for you today. `;
      if (dsrData.current_festive_season) {
        briefing += `Don't forget it's ${dsrData.current_festive_season} season - great time to push those festive items! `;
      }
      break;

    case "motivator":
      briefing = `You're at ${targetStr}! `;
      briefing += performance.status === "excellent" || performance.status === "good"
        ? "YOU'RE CRUSHING IT! "
        : "TIME TO STEP UP AND DOMINATE! ";
      briefing += `${priorityOutlets.length} outlets need your attention TODAY! `;
      if (dsrData.current_festive_season) {
        briefing += `${dsrData.current_festive_season} is YOUR TIME TO SHINE! `;
      }
      break;

    case "advisor":
      briefing = `Let's assess your position: ${targetStr}. `;
      briefing += `Strategic focus today: ${priorityOutlets.length} high-priority outlets. `;
      if (dsrData.current_festive_season) {
        briefing += `Leverage ${dsrData.current_festive_season} demand strategically. `;
      }
      break;
  }

  // Add outlet names
  if (priorityOutlets.length > 0) {
    briefing += `Top outlets: ${priorityOutlets.slice(0, 3).map((o) => o.name).join(", ")}.`;
  }

  return briefing;
}

export function generateOutletIntelligence(outlet: Outlet): string {
  const daysSince = getDaysSince(outlet.last_visit_date);
  let intelligence = `${outlet.name} (${outlet.type})\n`;
  intelligence += `Owner: ${outlet.owner_name}\n`;
  intelligence += `Last visited: ${daysSince} days ago\n`;
  intelligence += `Average order: LKR ${outlet.avg_order_value.toLocaleString()}\n`;
  intelligence += `Relationship score: ${outlet.relationship_score}/10\n`;
  intelligence += `Best time to visit: ${outlet.preferred_visit_time}\n`;

  if (outlet.notes.length > 0) {
    intelligence += `\nNotes:\n${outlet.notes.map((n) => `• ${n}`).join("\n")}`;
  }

  return intelligence;
}

// Multi-DSR Helper Functions

/**
 * Get all unique DSR IDs from records
 */
export function getAllDSRIds(allRecords: DSRInfo[]): string[] {
  const uniqueIds = new Set(allRecords.map((record) => record.dsr_id));
  return Array.from(uniqueIds).sort();
}

/**
 * Get all records for a specific DSR, sorted by date (latest first)
 */
export function getDSRHistory(allRecords: DSRInfo[], dsrId: string): DSRInfo[] {
  return allRecords
    .filter((record) => record.dsr_id === dsrId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get latest record for a specific DSR
 */
export function getLatestDSRRecord(allRecords: DSRInfo[], dsrId: string): DSRInfo | null {
  const history = getDSRHistory(allRecords, dsrId);
  return history.length > 0 ? history[0] : null;
}

/**
 * Get DSR records filtered by year-month
 */
export function getDSRRecordsByMonth(
  allRecords: DSRInfo[],
  dsrId: string,
  yearMonth: string
): DSRInfo[] {
  return allRecords
    .filter((record) => record.dsr_id === dsrId && record.year_month === yearMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Compare current performance with previous records
 */
export function compareWithPreviousRecords(
  currentRecord: DSRInfo,
  history: DSRInfo[]
): {
  targetAchievementTrend: "improving" | "declining" | "stable";
  salesGrowthTrend: "improving" | "declining" | "stable";
  routeEfficiencyTrend: "improving" | "declining" | "stable";
  insights: string[];
} {
  if (history.length < 2) {
    return {
      targetAchievementTrend: "stable",
      salesGrowthTrend: "stable",
      routeEfficiencyTrend: "stable",
      insights: ["Not enough historical data for comparison"],
    };
  }

  const previousRecord = history[1]; // Second record (first is current)
  const insights: string[] = [];

  // Compare target achievement
  const currentTarget = parseFloat(currentRecord.target_achievement.replace("%", ""));
  const previousTarget = parseFloat(previousRecord.target_achievement.replace("%", ""));
  const targetDiff = currentTarget - previousTarget;

  let targetAchievementTrend: "improving" | "declining" | "stable" = "stable";
  if (targetDiff > 5) {
    targetAchievementTrend = "improving";
    insights.push(`Target achievement improved by ${targetDiff.toFixed(1)}%`);
  } else if (targetDiff < -5) {
    targetAchievementTrend = "declining";
    insights.push(`Target achievement declined by ${Math.abs(targetDiff).toFixed(1)}%`);
  }

  // Compare sales growth
  const currentGrowth = parseFloat(currentRecord.sales_growth_trend.replace("%", ""));
  const previousGrowth = parseFloat(previousRecord.sales_growth_trend.replace("%", ""));
  const growthDiff = currentGrowth - previousGrowth;

  let salesGrowthTrend: "improving" | "declining" | "stable" = "stable";
  if (growthDiff > 3) {
    salesGrowthTrend = "improving";
    insights.push(`Sales growth momentum increasing (+${growthDiff.toFixed(1)}%)`);
  } else if (growthDiff < -3) {
    salesGrowthTrend = "declining";
    insights.push(`Sales growth momentum decreasing (${growthDiff.toFixed(1)}%)`);
  }

  // Compare route efficiency
  const efficiencyDiff = currentRecord.route_efficiency_score - previousRecord.route_efficiency_score;

  let routeEfficiencyTrend: "improving" | "declining" | "stable" = "stable";
  if (efficiencyDiff > 5) {
    routeEfficiencyTrend = "improving";
    insights.push(`Route efficiency improved by ${efficiencyDiff.toFixed(1)} points`);
  } else if (efficiencyDiff < -5) {
    routeEfficiencyTrend = "declining";
    insights.push(`Route efficiency declined by ${Math.abs(efficiencyDiff).toFixed(1)} points`);
  }

  return {
    targetAchievementTrend,
    salesGrowthTrend,
    routeEfficiencyTrend,
    insights,
  };
}

/**
 * Get performance trend over multiple records
 */
export function getPerformanceTrend(history: DSRInfo[]): {
  dates: string[];
  targetAchievement: number[];
  salesGrowth: number[];
  routeEfficiency: number[];
} {
  // Get last 6 records, sorted oldest to newest for charting
  const recentHistory = history.slice(0, 6).reverse();

  return {
    dates: recentHistory.map((r) => r.date),
    targetAchievement: recentHistory.map((r) => parseFloat(r.target_achievement.replace("%", ""))),
    salesGrowth: recentHistory.map((r) => parseFloat(r.sales_growth_trend.replace("%", ""))),
    routeEfficiency: recentHistory.map((r) => r.route_efficiency_score),
  };
}
