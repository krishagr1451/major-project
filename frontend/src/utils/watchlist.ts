export type WatchlistItem = {
  symbol: string;
  name: string;
  exchange?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: string;
  sparkline?: number[];
  source?: string;
  updatedAt?: string;
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

export function getWatchlistStorageKey() {
  return `portfolioWatchlist:${getUserId()}`;
}

export function loadWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(getWatchlistStorageKey());
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(rows: WatchlistItem[]) {
  localStorage.setItem(getWatchlistStorageKey(), JSON.stringify(rows));
}

export function normalizeWatchlistRows(rows: unknown): WatchlistItem[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row: any) => ({
      symbol: String(row.symbol || "").toUpperCase().trim(),
      name: String(row.name || row.symbol || "").trim(),
      exchange: row.exchange ? String(row.exchange) : undefined,
      price: Number.isFinite(Number(row.price)) ? Number(row.price) : undefined,
      change: Number.isFinite(Number(row.change)) ? Number(row.change) : undefined,
      changePercent: Number.isFinite(Number(row.changePercent)) ? Number(row.changePercent) : undefined,
      volume: row.volume ? String(row.volume) : undefined,
      sparkline: Array.isArray(row.sparkline) ? row.sparkline.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v)) : undefined,
      source: row.source ? String(row.source) : undefined,
      updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    }))
    .filter((row) => row.symbol);
}
