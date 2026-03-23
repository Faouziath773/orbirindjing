import { applyCors, handleOptions, methodNotAllowed } from "./_utils.js";
import { healthCheck } from "../server/src/services/candidateService.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }
  try {
    await healthCheck();
    return res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).json({ status: "error" });
  }
}
