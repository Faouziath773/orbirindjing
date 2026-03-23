const DEFAULT_ORIGIN = "http://localhost:5173";

export function getAllowedOrigins() {
  const raw =
    process.env.CORS_ORIGINS || process.env.APP_BASE_URL || DEFAULT_ORIGIN;
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function applyCors(req, res) {
  const origin = req.headers?.origin;
  const allowedOrigins = getAllowedOrigins();
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Admin-Code, X-Fedapay-Signature"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "false");
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function enhanceReq(req) {
  if (!req.get) {
    req.get = (name) => {
      const key = String(name || "").toLowerCase();
      return req.headers?.[key];
    };
  }
}

export async function readRawBody(req) {
  if (req.rawBody) {
    return req.rawBody;
  }
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export async function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const raw = await readRawBody(req);
  req.rawBody = raw;
  if (!raw || raw.length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return {};
  }
}

export function methodNotAllowed(res, methods = ["GET"]) {
  res.setHeader("Allow", methods.join(", "));
  res.status(405).json({ error: "Method not allowed." });
}

export async function runMiddleware(req, res, middleware) {
  return await new Promise((resolve) => {
    middleware(req, res, () => resolve(true));
  });
}
