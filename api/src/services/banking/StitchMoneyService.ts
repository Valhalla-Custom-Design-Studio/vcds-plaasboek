/**
 * Stitch Money  -  SA Open Banking API
 * Bank-grade: FNB, Absa, Standard Bank, Nedbank, Capitec
 * Free sandbox, production: per-transaction pricing
 * Use case: Bank statement import, payment initiation, account verification
 */

const STITCH_CLIENT_ID = process.env.STITCH_CLIENT_ID || "";
const STITCH_CLIENT_SECRET = process.env.STITCH_CLIENT_SECRET || "";
const STITCH_BASE = "https://api.stitch.money";

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: "DEBIT" | "CREDIT";
  category?: string;
  farmCategory?: "FEED" | "FUEL" | "EQUIPMENT" | "LABOUR" | "VETERINARY" | "SEEDS" | "INCOME" | "OTHER";
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${STITCH_BASE}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${STITCH_CLIENT_ID}&client_secret=${STITCH_CLIENT_SECRET}&audience=https://api.stitch.money&scope=client_paymentrequest`,
  });
  const data = await res.json();
  return data.access_token;
}

export async function getAccountTransactions(accountToken: string, fromDate: string, toDate: string): Promise<BankTransaction[]> {
  const query = `
    query GetTransactions($fromDate: Date!, $toDate: Date!) {
      user { accounts { transactions(filter: { date: { gte: $fromDate, lte: $toDate } }) {
        edges { node { id date description amount { quantity currency } type } }
      }}}
    }
  `;
  const res = await fetch(`${STITCH_BASE}/graphql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accountToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { fromDate, toDate } }),
  });
  const data = await res.json();
  const edges = data.data?.user?.accounts?.[0]?.transactions?.edges || [];
  return edges.map((e: any) => ({
    id: e.node.id,
    date: e.node.date,
    description: e.node.description,
    amount: e.node.amount.quantity,
    currency: e.node.amount.currency,
    type: e.node.amount.quantity < 0 ? "DEBIT" : "CREDIT",
    farmCategory: categorizeFarmTransaction(e.node.description),
  }));
}

function categorizeFarmTransaction(description: string): BankTransaction["farmCategory"] {
  const d = description.toLowerCase();
  if (d.includes("feed") || d.includes("voer") || d.includes("lick")) return "FEED";
  if (d.includes("fuel") || d.includes("petrol") || d.includes("diesel")) return "FUEL";
  if (d.includes("vet") || d.includes("dip") || d.includes("vaccine")) return "VETERINARY";
  if (d.includes("seed") || d.includes("saad") || d.includes("fertilizer")) return "SEEDS";
  if (d.includes("labour") || d.includes("salary") || d.includes("wages")) return "LABOUR";
  if (d.includes("tractor") || d.includes("equipment") || d.includes("implement")) return "EQUIPMENT";
  return "OTHER";
}

// Initiate payment (PayFast alternative for B2B farm payments)
export async function initiatePayment(amount: number, reference: string, beneficiaryAccount: string): Promise<{ paymentUrl: string; id: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${STITCH_BASE}/graphql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation CreatePaymentRequest($amount: MoneyInput!, $reference: String!, $beneficiaryAccount: String!) {
        clientPaymentInitiationRequestCreate(input: { amount: $amount, externalReference: $reference, beneficiaryBankAccount: { id: $beneficiaryAccount } }) {
          paymentInitiationRequest { id url }
        }
      }`,
      variables: { amount: { quantity: amount, currency: "ZAR" }, reference, beneficiaryAccount },
    }),
  });
  const data = await res.json();
  const req = data.data?.clientPaymentInitiationRequestCreate?.paymentInitiationRequest;
  return { paymentUrl: req?.url || "", id: req?.id || "" };
}
