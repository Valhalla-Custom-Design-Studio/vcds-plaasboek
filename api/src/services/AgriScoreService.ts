/**
 * AgriScore(TM)  -  SA-First Agricultural Creditworthiness Score
 * SA First: Real-time farm credit score for Land Bank / Absa AgriBusiness
 * Patent pending  -  VCDS(TM) IP Asset
 */

export interface AgriScoreInput {
  farmer_id: string;
  farm_size_ha: number;
  farm_type: "crop" | "livestock" | "mixed" | "horticulture" | "dairy";
  years_farming: number;
  // Financial
  annual_revenue_zar: number;
  annual_expenses_zar: number;
  outstanding_debt_zar: number;
  payment_history_score: number; // 0-100 (from Plaasboek payment records)
  // Production
  avg_yield_last_3_years: number; // tons/ha or head count
  yield_consistency: number; // 0-1 (std dev normalized)
  // Environmental
  avg_rainfall_mm: number;
  drought_years_last_5: number;
  irrigation_available: boolean;
  // Compliance
  gap_certified: boolean; // Good Agricultural Practice
  vat_registered: boolean;
  land_title_secured: boolean;
}

export interface AgriScoreResult {
  farmer_id: string;
  agri_score: number; // 300-850 (credit score range)
  grade: "Excellent" | "Good" | "Fair" | "Poor" | "Very Poor";
  components: AgriScoreComponents;
  recommended_credit_limit_zar: number;
  interest_rate_band: string;
  lender_recommendation: string;
  risk_factors: string[];
  improvement_tips: string[];
  calculated_at: string;
  ip_watermark: string;
}

interface AgriScoreComponents {
  financial_health_score: number;
  production_performance_score: number;
  environmental_resilience_score: number;
  compliance_score: number;
  experience_score: number;
}

export function calculateAgriScore(input: AgriScoreInput): AgriScoreResult {
  // Financial Health (0-250)
  const profit_margin = input.annual_revenue_zar > 0
    ? (input.annual_revenue_zar - input.annual_expenses_zar) / input.annual_revenue_zar
    : 0;
  const debt_ratio = input.annual_revenue_zar > 0
    ? input.outstanding_debt_zar / input.annual_revenue_zar
    : 1;
  const financial_health_score = Math.round(
    Math.max(0, profit_margin * 100) +
    Math.max(0, (1 - Math.min(debt_ratio, 1)) * 100) +
    input.payment_history_score * 0.5
  );

  // Production Performance (0-200)
  const production_performance_score = Math.round(
    input.yield_consistency * 100 +
    Math.min(input.avg_yield_last_3_years / 10, 1) * 100
  );

  // Environmental Resilience (0-150)
  const drought_penalty = input.drought_years_last_5 * 20;
  const irrigation_bonus = input.irrigation_available ? 50 : 0;
  const environmental_resilience_score = Math.max(0, Math.round(
    100 - drought_penalty + irrigation_bonus
  ));

  // Compliance (0-150)
  const compliance_score = Math.round(
    (input.gap_certified ? 60 : 0) +
    (input.vat_registered ? 50 : 0) +
    (input.land_title_secured ? 40 : 0)
  );

  // Experience (0-100)
  const experience_score = Math.round(Math.min(input.years_farming / 20, 1) * 100);

  const raw_score = financial_health_score + production_performance_score +
    environmental_resilience_score + compliance_score + experience_score;

  // Scale to 300-850 range (like credit score)
  const agri_score = Math.round(300 + (raw_score / 850) * 550);
  const capped_score = Math.min(850, Math.max(300, agri_score));

  const grade = capped_score >= 750 ? "Excellent"
    : capped_score >= 650 ? "Good"
    : capped_score >= 550 ? "Fair"
    : capped_score >= 450 ? "Poor"
    : "Very Poor";

  const credit_multiplier = capped_score >= 750 ? 3 : capped_score >= 650 ? 2 : capped_score >= 550 ? 1.5 : 1;
  const recommended_credit_limit_zar = Math.round(input.annual_revenue_zar * credit_multiplier);

  const interest_rate_band = capped_score >= 750 ? "Prime - 1% (best rate)"
    : capped_score >= 650 ? "Prime + 1%"
    : capped_score >= 550 ? "Prime + 3%"
    : "Prime + 5% (high risk)";

  const risk_factors: string[] = [];
  if (profit_margin < 0.1) risk_factors.push("Low profit margin");
  if (debt_ratio > 0.5) risk_factors.push("High debt-to-revenue ratio");
  if (input.drought_years_last_5 >= 3) risk_factors.push("High drought exposure");
  if (!input.land_title_secured) risk_factors.push("No secured land title");
  if (!input.irrigation_available) risk_factors.push("Rain-dependent farming");

  return {
    farmer_id: input.farmer_id,
    agri_score: capped_score,
    grade,
    components: {
      financial_health_score,
      production_performance_score,
      environmental_resilience_score,
      compliance_score,
      experience_score,
    },
    recommended_credit_limit_zar,
    interest_rate_band,
    lender_recommendation: `${grade} risk profile. Recommended for ${grade === "Excellent" || grade === "Good" ? "standard" : "conditional"} agricultural credit.`,
    risk_factors,
    improvement_tips: [
      "Register for GAP certification to improve compliance score",
      "Install irrigation to reduce drought risk",
      "Maintain consistent payment history on Plaasboek",
    ],
    calculated_at: new Date().toISOString(),
    ip_watermark: "AgriScore(TM)  -  VCDS(TM) Patent Pending ZA2026/XXXXX",
  };
}
