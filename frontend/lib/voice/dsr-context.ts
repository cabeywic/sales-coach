/**
 * Helper functions to format DSR data for ElevenLabs voice agent
 */

import { DSRData } from "@/types";

/**
 * Format DSR data into a concise context string for the voice agent
 * This is sent at the start of each conversation
 */
export function formatDSRContext(dsr: DSRData): string {
  if (!dsr) return "";

  return `
CURRENT USER CONTEXT:
- Name: ${dsr.dsr_name}
- DSR ID: ${dsr.dsr_id}
- Region: ${dsr.region}
- Distributor: ${dsr.distributor}

PERFORMANCE OVERVIEW:
- Target Achievement: ${dsr.target_achievement} (${dsr.target_achievement_tag})
- Sales Growth: ${dsr.sales_growth_trend} (${dsr.sales_growth_tag})
- Overall Performance: ${dsr.overall_good_bad_performing_dsr_tag}
- Route Efficiency: ${dsr.route_efficiency_score}%

KEY METRICS:
- Outlets Visited: ${dsr.outlets_visited}/${dsr.outlets_to_sell_to}
- Missed Outlets Last Week: ${dsr.outlets_missed_last_week}
- Avg Monthly Sales: ${dsr.avg_monthly_sales_for_month_of_dsr}
- Volume per Outlet: ${dsr.volume_per_outlet}

STRENGTHS & DEVELOPMENT:
- Strength Areas: ${dsr.strength_areas}
- Development Areas: ${dsr.development_areas}
- Response Rate: ${dsr.response_rate_to_coach}

CONTEXT:
- Current Route: ${dsr.route_id}
- DSR Type: ${dsr.dsr_type}
- Best Performance Day: ${dsr.day_of_week_performance}
- Recent Summary: ${dsr.conversation_summary_last_week}

Use this information to provide personalized coaching and advice.
`.trim();
}

/**
 * Format performance summary for quick reference
 */
export function formatPerformanceSummary(dsr: DSRData): string {
  if (!dsr) return "";

  return `${dsr.dsr_name} is a ${dsr.dsr_type} DSR with ${dsr.target_achievement} target achievement. Key focus: ${dsr.development_areas}`;
}

/**
 * Format current day/route context
 */
export function formatCurrentRouteContext(dsr: DSRData): string {
  if (!dsr) return "";

  return `
Today's Route: ${dsr.route_id} in ${dsr.region}
Outlets to Cover: ${dsr.outlets_to_sell_to} (Eateries: ${dsr.eateries_to_sell_to}, Non-eateries: ${dsr.noneateries_to_sell_to}, SMMT: ${dsr.smmt_to_sell_to})
SKUs to Cover: ${dsr.sku_to_cover}
Current Progress: ${dsr.sku_focus_progress}
Competitor Presence: ${dsr.competitor_presence}
`.trim();
}

/**
 * Format sales performance context
 */
export function formatSalesContext(dsr: DSRData): string {
  if (!dsr) return "";

  return `
Sales Performance:
- Monthly Average: ${dsr.avg_monthly_sales_for_month_of_dsr}
- Growth Trend: ${dsr.sales_growth_trend} (${dsr.sales_growth_tag})
- Target Achievement: ${dsr.target_achievement} (${dsr.target_achievement_tag})
- Volume per Outlet: ${dsr.volume_per_outlet}
`.trim();
}

/**
 * Get contextual coaching tips based on DSR data
 */
export function getCoachingTips(dsr: DSRData): string[] {
  if (!dsr) return [];

  const tips: string[] = [];

  // Target achievement tips
  if (parseInt(dsr.target_achievement) < 80) {
    tips.push("Focus on increasing outlet coverage and SKU penetration");
  } else if (parseInt(dsr.target_achievement) > 120) {
    tips.push("Excellent target achievement! Share best practices with team");
  }

  // Route efficiency tips
  if (dsr.route_efficiency_score < 70) {
    tips.push("Route planning needs improvement - consider optimizing visit sequence");
  }

  // Missed outlets tips
  if (dsr.outlets_missed_last_week > 3) {
    tips.push(`${dsr.outlets_missed_last_week} outlets missed last week - prioritize these today`);
  }

  // Development area tips
  if (dsr.development_areas) {
    tips.push(`Development focus: ${dsr.development_areas}`);
  }

  return tips;
}

/**
 * Format check-in specific context
 */
export function formatCheckInContext(dsr: DSRData, outletId?: string): string {
  if (!dsr) return "";

  let context = `
Check-in Context for ${dsr.dsr_name}:
- Current Route: ${dsr.route_id}
- Today's Progress: ${dsr.outlets_visited}/${dsr.outlets_to_sell_to} outlets visited
- Route Efficiency: ${dsr.route_efficiency_score}%
`;

  if (outletId) {
    context += `\n- Current Outlet: ${outletId}`;
  }

  const tips = getCoachingTips(dsr);
  if (tips.length > 0) {
    context += `\n\nCoaching Tips:\n${tips.map(tip => `- ${tip}`).join('\n')}`;
  }

  return context.trim();
}

/**
 * Format coaching session context
 */
export function formatCoachingContext(dsr: DSRData): string {
  if (!dsr) return "";

  return `
Coaching Session for ${dsr.dsr_name}:

PERFORMANCE ANALYSIS:
- Overall Rating: ${dsr.overall_good_bad_performing_dsr_tag}
- Target Achievement: ${dsr.target_achievement} (${dsr.target_achievement_tag})
- Sales Growth: ${dsr.sales_growth_trend}
- Route Efficiency: ${dsr.route_efficiency_score}%

STRENGTHS:
${dsr.strength_areas}

DEVELOPMENT AREAS:
${dsr.development_areas}

RECENT ACTIVITY:
- Outlets Visited: ${dsr.outlets_visited}/${dsr.outlets_to_sell_to}
- Missed Last Week: ${dsr.outlets_missed_last_week}
- Last Week Summary: ${dsr.conversation_summary_last_week}

ENGAGEMENT:
- Response Rate: ${dsr.response_rate_to_coach}
- Preferred Check-in Time: ${dsr.preferred_checkin_time}
- Best Performance Day: ${dsr.day_of_week_performance}

Provide personalized coaching based on this data.
`.trim();
}

