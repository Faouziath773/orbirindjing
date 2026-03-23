import { applyCors, handleOptions, methodNotAllowed } from "./_utils.js";
import { testDatabaseConnection } from "../server/src/services/candidateService.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }
  try {
    const data = await testDatabaseConnection();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Test DB error:", error);
    return res.status(500).json({ success: false, error: "Erreur base." });
  }
}
