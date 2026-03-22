const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("accessToken");
}

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const token = getStoredAccessToken();
  const hasAuthorizationHeader = !!(options.headers as Record<string, string> | undefined)?.Authorization;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !hasAuthorizationHeader ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`API Error on ${endpoint}:`, data);
    throw new ApiError(data.error || `API request failed with status ${response.status}`, response.status);
  }

  return data;
}

// ===== BACKTESTS API =====

export const backtestsAPI = {
  // Get all backtests
  getAll: async () => {
    return apiCall('/backtests');
  },

  // Get single backtest by ID
  getById: async (id: string) => {
    return apiCall(`/backtests/${id}`);
  },

  // Create new backtest
  create: async (backtest: any) => {
    return apiCall('/backtests', {
      method: 'POST',
      body: JSON.stringify(backtest),
    });
  },

  // Run backtest engine (CSV + live market provider)
  run: async (payload: any) => {
    return apiCall('/backtest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Update backtest
  update: async (id: string, updates: any) => {
    return apiCall(`/backtests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete backtest
  delete: async (id: string) => {
    return apiCall(`/backtests/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== STRATEGIES API =====

export const strategiesAPI = {
  // Get all strategies
  getAll: async () => {
    return apiCall('/strategies');
  },

  // Create strategy
  create: async (strategy: any) => {
    return apiCall('/strategies', {
      method: 'POST',
      body: JSON.stringify(strategy),
    });
  },

  // Delete strategy
  delete: async (id: string) => {
    return apiCall(`/strategies/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== ALERTS API =====

export const alertsAPI = {
  // Get all alerts
  getAll: async () => {
    return apiCall('/alerts');
  },

  // Create alert
  create: async (alert: any) => {
    return apiCall('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  },

  // Update alert
  update: async (id: string, updates: any) => {
    return apiCall(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete alert
  delete: async (id: string) => {
    return apiCall(`/alerts/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===== PORTFOLIOS API =====

export const portfoliosAPI = {
  // Get all portfolios
  getAll: async () => {
    return apiCall('/portfolios');
  },

  // Create portfolio
  create: async (portfolio: any) => {
    return apiCall('/portfolios', {
      method: 'POST',
      body: JSON.stringify(portfolio),
    });
  },

  // Update portfolio
  update: async (id: string, updates: any) => {
    return apiCall(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete portfolio
  delete: async (id: string) => {
    return apiCall(`/portfolios/${id}`, {
      method: 'DELETE',
    });
  },

  sync: async (items: any[]) => {
    return apiCall('/portfolios/sync', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
};

export const watchlistAPI = {
  getAll: async () => {
    return apiCall('/watchlist');
  },

  sync: async (items: any[]) => {
    return apiCall('/watchlist/sync', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
};

// ===== STOCK DATA API =====

export const stockDataAPI = {
  // Upload CSV file for backtesting engine
  uploadCsv: async (symbol: string, file: File) => {
    const url = `${API_URL}/upload`;
    const token = getStoredAccessToken();
    const formData = new FormData();
    formData.append("symbol", symbol);
    formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Upload failed with status ${response.status}`);
    }
    return data;
  },

  // Upload stock data
  upload: async (symbol: string, data: any) => {
    return apiCall('/upload-data', {
      method: 'POST',
      body: JSON.stringify({ symbol, data }),
    });
  },

  // Get stock data by symbol
  getBySymbol: async (symbol: string) => {
    return apiCall(`/stock-data/${symbol}`);
  },

  // Get all uploaded stock data
  getAll: async () => {
    return apiCall('/stock-data');
  },
};

// ===== AUTH API =====

export const authAPI = {
  // Sign up
  signup: async (email: string, password: string, name: string) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  // Login
  login: async (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Logout
  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user
  getCurrentUser: async (accessToken?: string) => {
    return apiCall('/auth/me', {
      ...(accessToken
        ? {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        : {}),
    });
  },
};

// ===== HEALTH CHECK =====

export const healthCheck = async () => {
  return apiCall('/health');
};

// ===== MARKET API =====

export const marketAPI = {
  getQuote: async (symbol: string, exchange = 'nse') => {
    const safeSymbol = encodeURIComponent(symbol);
    const safeExchange = encodeURIComponent(exchange);
    return apiCall(`/market/quote/${safeSymbol}?exchange=${safeExchange}`);
  },

  getCandles: async (
    symbol: string,
    options?: {
      exchange?: string;
      resolution?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const safeSymbol = encodeURIComponent(symbol);
    const params = new URLSearchParams();

    if (options?.exchange) params.set('exchange', options.exchange);
    if (options?.resolution) params.set('resolution', options.resolution);
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);

    const query = params.toString();
    return apiCall(`/market/candles/${safeSymbol}${query ? `?${query}` : ''}`);
  },

  getProfile: async (symbol: string, exchange = 'nse') => {
    const safeSymbol = encodeURIComponent(symbol);
    const safeExchange = encodeURIComponent(exchange);
    return apiCall(`/market/profile/${safeSymbol}?exchange=${safeExchange}`);
  },

  getAll: async (symbol: string, exchange = 'nse') => {
    const safeSymbol = encodeURIComponent(symbol);
    const safeExchange = encodeURIComponent(exchange);
    return apiCall(`/market/all/${safeSymbol}?exchange=${safeExchange}`);
  },

  searchSymbols: async (query: string) => {
    const q = encodeURIComponent(query);
    return apiCall(`/market/search?q=${q}`);
  },
};
