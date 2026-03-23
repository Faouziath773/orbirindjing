import { applyCors, handleOptions, enhanceReq, parseJsonBody, methodNotAllowed } from "./_utils.js";
import { validateRegistration } from "../server/src/controllers/candidateController.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  enhanceReq(req);
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }
  req.body = await parseJsonBody(req);
  return validateRegistration(req, res);
}
