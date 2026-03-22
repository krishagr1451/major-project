import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Lazy-load Supabase client only when needed
let supabaseClient: any = null;
async function getSupabase() {
  if (!supabaseClient) {
    const { createClient } = await import("jsr:@supabase/supabase-js@2");
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
  }
  return supabaseClient;
}

// Enable CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Health check
app.get("/make-server-4c14362f/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTH ROUTES =====

app.post("/make-server-4c14362f/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: "Email and password required" }, 400);
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      email_confirm: true,
    });

    if (error) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({ success: true, data: { user: data.user } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-4c14362f/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: "Email and password required" }, 400);
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return c.json({ success: false, error: error.message }, 401);
    }
    return c.json({
      success: true,
      data: { user: data.user, accessToken: data.session?.access_token },
    });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-4c14362f/auth/logout", async (c) => {
  try {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-4c14362f/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ success: false, error: "No token" }, 401);
    }

    const supabase = await getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ success: false, error: "Invalid token" }, 401);
    }
    return c.json({ success: true, data: { user } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== BACKTESTS ROUTES =====

app.get("/make-server-4c14362f/backtests", async (c) => {
  try {
    const data = await kv.getByPrefix("backtest:");
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-4c14362f/backtests/:id", async (c) => {
  try {
    const data = await kv.get(`backtest:${c.req.param("id")}`);
    if (!data) return c.json({ success: false, error: "Not found" }, 404);
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-4c14362f/backtests", async (c) => {
  try {
    const backtest = await c.req.json();
    const id = backtest.id || crypto.randomUUID();
    await kv.set(`backtest:${id}`, { ...backtest, id, createdAt: new Date().toISOString() });
    return c.json({ success: true, data: { id } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put("/make-server-4c14362f/backtests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(`backtest:${id}`);
    if (!existing) return c.json({ success: false, error: "Not found" }, 404);
    await kv.set(`backtest:${id}`, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-4c14362f/backtests/:id", async (c) => {
  try {
    await kv.del(`backtest:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== STRATEGIES ROUTES =====

app.get("/make-server-4c14362f/strategies", async (c) => {
  try {
    const data = await kv.getByPrefix("strategy:");
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-4c14362f/strategies", async (c) => {
  try {
    const strategy = await c.req.json();
    const id = strategy.id || crypto.randomUUID();
    await kv.set(`strategy:${id}`, { ...strategy, id });
    return c.json({ success: true, data: { id } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-4c14362f/strategies/:id", async (c) => {
  try {
    await kv.del(`strategy:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== ALERTS ROUTES =====

app.get("/make-server-4c14362f/alerts", async (c) => {
  try {
    const data = await kv.getByPrefix("alert:");
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-4c14362f/alerts", async (c) => {
  try {
    const alert = await c.req.json();
    const id = alert.id || crypto.randomUUID();
    await kv.set(`alert:${id}`, { ...alert, id });
    return c.json({ success: true, data: { id } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put("/make-server-4c14362f/alerts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(`alert:${id}`);
    if (!existing) return c.json({ success: false, error: "Not found" }, 404);
    await kv.set(`alert:${id}`, { ...existing, ...updates });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-4c14362f/alerts/:id", async (c) => {
  try {
    await kv.del(`alert:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== PORTFOLIOS ROUTES =====

app.get("/make-server-4c14362f/portfolios", async (c) => {
  try {
    const data = await kv.getByPrefix("portfolio:");
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post("/make-server-4c14362f/portfolios", async (c) => {
  try {
    const portfolio = await c.req.json();
    const id = portfolio.id || crypto.randomUUID();
    await kv.set(`portfolio:${id}`, { ...portfolio, id });
    return c.json({ success: true, data: { id } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put("/make-server-4c14362f/portfolios/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await kv.get(`portfolio:${id}`);
    if (!existing) return c.json({ success: false, error: "Not found" }, 404);
    await kv.set(`portfolio:${id}`, { ...existing, ...updates });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete("/make-server-4c14362f/portfolios/:id", async (c) => {
  try {
    await kv.del(`portfolio:${c.req.param("id")}`);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== STOCK DATA ROUTES =====

app.post("/make-server-4c14362f/upload-data", async (c) => {
  try {
    const { symbol, data } = await c.req.json();
    await kv.set(`stock:${symbol}`, { symbol, data, uploadedAt: new Date().toISOString() });
    return c.json({ success: true, data: { symbol } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-4c14362f/stock-data/:symbol", async (c) => {
  try {
    const data = await kv.get(`stock:${c.req.param("symbol")}`);
    if (!data) return c.json({ success: false, error: "Not found" }, 404);
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.get("/make-server-4c14362f/stock-data", async (c) => {
  try {
    const data = await kv.getByPrefix("stock:");
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
