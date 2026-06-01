/**
 * Nasdaq Data Link (Quandl)  -  SA commodity prices
 * Free tier: 50 calls/day
 * Use case: Maize, wheat, beef, wool prices for farm P&L
 */

const QUANDL_API_KEY = process.env.QUANDL_API_KEY || "";
const QUANDL_BASE = "https://data.nasdaq.com/api/v3";

export interface CommodityPrice {
  commodity: string;
  price: number;
  currency: string;
  unit: string;
  date: string;
  change: number;
  changePercent: number;
}

// SA commodity codes
const SA_COMMODITIES: Record<string, { dataset: string; unit: string }> = {
  maize: { dataset: "CHRIS/CME_C1", unit: "per bushel" },
  wheat: { dataset: "CHRIS/CME_W1", unit: "per bushel" },
  beef: { dataset: "CHRIS/CME_FC1", unit: "per cwt" },
  wool: { dataset: "CHRIS/ICE_CT1", unit: "per lb" },
  sunflower: { dataset: "CHRIS/CME_BO1", unit: "per cwt" },
};

export async function getCommodityPrice(commodity: string): Promise<CommodityPrice | null> {
  const config = SA_COMMODITIES[commodity.toLowerCase()];
  if (!config) return null;
  const res = await fetch(`${QUANDL_BASE}/datasets/${config.dataset}/data.json?rows=2&api_key=${QUANDL_API_KEY}`);
  if (!res.ok) return null;
  const data = await res.json();
  const rows = data.dataset_data?.data || [];
  if (rows.length < 2) return null;
  const [latest, prev] = rows;
  const price = latest[4] || latest[1]; // Close price
  const prevPrice = prev[4] || prev[1];
  const change = price - prevPrice;
  return {
    commodity,
    price: Math.round(price * 100) / 100,
    currency: "USD",
    unit: config.unit,
    date: latest[0],
    change: Math.round(change * 100) / 100,
    changePercent: Math.round((change / prevPrice) * 10000) / 100,
  };
}

export async function getAllSACommodityPrices(): Promise<CommodityPrice[]> {
  const results = await Promise.allSettled(
    Object.keys(SA_COMMODITIES).map(c => getCommodityPrice(c))
  );
  return results.filter(r => r.status === "fulfilled" && r.value).map(r => (r as any).value);
}
