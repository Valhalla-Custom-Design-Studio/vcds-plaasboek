/**
 * AgriScore(TM)  -  SA-First agricultural creditworthiness score
 * PATENT PENDING  -  VCDS(TM) IP Asset
 * Licensable to: Land Bank, Absa AgriBusiness, Nedbank Agri, FNB Agriculture
 */

export interface AgriScoreInput {
  farmerId: string;
  farmSizeHectares: number;
  farmType: "CROPS" | "LIVESTOCK" | "MIXED" | "HORTICULTURE";
  yearsInFarming: number;
  annualRevenueZAR: number;
  annualExpensesZAR: number;
  outstandingDebtZAR: number;
  paymentHistoryScore: number; // 0-100 from bank data
  rainfallReliability: number; // 0-100 (from Open-Meteo 5yr avg)
  commodityPriceTrend: number; // -1 to 1 (from Quandl)
  hasIrrigation: boolean;
  hasCropInsurance: boolean;
  hasLandTitle: boolean;
  previousLoansRepaid: number;
  previousLoansDefaulted: number;
}

export interface AgriScore {
  score: number; // 300-850 (like credit score)
  grade: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D";
  breakdown: {
    financialHealth: number;
    farmViability: number;
    riskProfile: number;
    creditHistory: number;
  };
  recommendedLoanAmount: number;
  recommendedInterestRate: number;
  lenderRecommendations: string[];
  improvementTips: string[];
}

export function calculateAgriScore(input: AgriScoreInput): AgriScore {
  // Financial Health (35%)
  const profitMargin = (input.annualRevenueZAR - input.annualExpensesZAR) / Math.max(input.annualRevenueZAR, 1);
  const debtRatio = input.outstandingDebtZAR / Math.max(input.annualRevenueZAR, 1);
  const financialHealth = Math.round(Math.max(0, Math.min(100, profitMargin * 100 * 0.6 + Math.max(0, 40 - debtRatio * 20))));

  // Farm Viability (30%)
  const farmViability = Math.round(
    (input.rainfallReliability * 0.3) +
    (Math.min(input.yearsInFarming / 20, 1) * 30) +
    (input.hasIrrigation ? 20 : 0) +
    (input.hasCropInsurance ? 15 : 0) +
    (input.hasLandTitle ? 5 : 0)
  );

  // Risk Profile (20%)
  const commodityRisk = Math.round((input.commodityPriceTrend + 1) / 2 * 50);
  const riskProfile = Math.round(commodityRisk + (input.hasCropInsurance ? 30 : 0) + (input.hasIrrigation ? 20 : 0));

  // Credit History (15%)
  const totalLoans = input.previousLoansRepaid + input.previousLoansDefaulted;
  const repaymentRate = totalLoans > 0 ? input.previousLoansRepaid / totalLoans : 0.5;
  const creditHistory = Math.round(repaymentRate * 70 + input.paymentHistoryScore * 0.3);

  // Convert to 300-850 scale
  const rawScore = financialHealth * 0.35 + farmViability * 0.3 + riskProfile * 0.2 + creditHistory * 0.15;
  const score = Math.round(300 + (rawScore / 100) * 550);

  const grade = score >= 800 ? "AAA" : score >= 750 ? "AA" : score >= 700 ? "A" : score >= 650 ? "BBB" : score >= 600 ? "BB" : score >= 550 ? "B" : score >= 500 ? "CCC" : "D";
  const recommendedLoanAmount = Math.round(input.annualRevenueZAR * (score >= 700 ? 2 : score >= 600 ? 1.5 : 1));
  const recommendedInterestRate = score >= 750 ? 8.5 : score >= 700 ? 9.5 : score >= 650 ? 11 : score >= 600 ? 13 : 15;

  const lenderRecommendations = [];
  if (score >= 650) lenderRecommendations.push("Land Bank  -  Production Loan");
  if (score >= 700) lenderRecommendations.push("Absa AgriBusiness  -  Term Loan");
  if (score >= 750) lenderRecommendations.push("Nedbank Agri  -  Asset Finance");
  if (score >= 600) lenderRecommendations.push("MAFISA  -  Smallholder Loan");

  const improvementTips = [];
  if (!input.hasCropInsurance) improvementTips.push("Get crop/livestock insurance (+15 points)");
  if (!input.hasIrrigation) improvementTips.push("Install irrigation system (+20 points)");
  if (debtRatio > 1) improvementTips.push("Reduce debt-to-revenue ratio below 1.0 (+25 points)");
  if (!input.hasLandTitle) improvementTips.push("Obtain formal land title (+10 points)");

  return { score, grade, breakdown: { financialHealth, farmViability, riskProfile, creditHistory }, recommendedLoanAmount, recommendedInterestRate, lenderRecommendations, improvementTips };
}
