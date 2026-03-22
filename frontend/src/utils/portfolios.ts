export type PortfolioColor = "green" | "blue" | "purple";

export type PortfolioHolding = {
  symbol: string;
  name: string;
  exchange?: string;
  quantity: number;
  avgPrice: number;
  price?: number;
  change?: number;
  changePercent?: number;
  sparkline?: number[];
};

export type PortfolioRecord = {
  id: string;
  name: string;
  color: PortfolioColor;
  holdings: PortfolioHolding[];
  createdAt: string;
};

function getAccessTokenSub(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return null;
    }
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded?.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

function getUserId(): string {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      const id = user?.id || user?.user?.id;
      if (typeof id === "string" && id.trim()) {
        return id;
      }
    }
  } catch {
  }

  const sub = getAccessTokenSub();
  if (sub) {
    return sub;
  }

  return "guest";
}

function getPortfoliosStorageKey() {
  return `portfolios:${getUserId()}`;
}

export function loadPortfolios(): PortfolioRecord[] {
  try {
    const raw = localStorage.getItem(getPortfoliosStorageKey());
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePortfolios(rows: PortfolioRecord[]) {
  localStorage.setItem(getPortfoliosStorageKey(), JSON.stringify(rows));
}

export function normalizePortfolios(rows: unknown): PortfolioRecord[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => row && typeof row === "object")
    .map((row: any) => ({
      id: String(row.id || crypto.randomUUID()),
      name: String(row.name || "Untitled Portfolio"),
      color: (["green", "blue", "purple"].includes(String(row.color)) ? row.color : "green") as PortfolioColor,
      holdings: Array.isArray(row.holdings)
        ? row.holdings.map((holding: any) => ({
            symbol: String(holding.symbol || "").toUpperCase().trim(),
            name: String(holding.name || holding.symbol || ""),
            exchange: holding.exchange ? String(holding.exchange) : undefined,
            quantity: Number(holding.quantity || 0),
            avgPrice: Number(holding.avgPrice || 0),
            price: Number.isFinite(Number(holding.price)) ? Number(holding.price) : undefined,
            change: Number.isFinite(Number(holding.change)) ? Number(holding.change) : undefined,
            changePercent: Number.isFinite(Number(holding.changePercent)) ? Number(holding.changePercent) : undefined,
            sparkline: Array.isArray(holding.sparkline)
              ? holding.sparkline.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v))
              : undefined,
          }))
        : [],
      createdAt: String(row.createdAt || new Date().toISOString()),
    }))
    .filter((row) => row.id);
}

export function getPortfolioMetrics(portfolio: PortfolioRecord) {
  const stocks = portfolio.holdings.length;
  const value = portfolio.holdings.reduce(
    (sum, holding) => sum + Number(holding.quantity || 0) * Number(holding.price ?? holding.avgPrice ?? 0),
    0
  );

  const invested = portfolio.holdings.reduce(
    (sum, holding) => sum + Number(holding.quantity || 0) * Number(holding.avgPrice || 0),
    0
  );

  const pnlPct = invested > 0 ? ((value - invested) / invested) * 100 : 0;

  return {
    stocks,
    value,
    returnPct: pnlPct,
  };
}
