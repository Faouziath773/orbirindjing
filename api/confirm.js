import { applyCors, handleOptions, enhanceReq, methodNotAllowed } from "./_utils.js";
import { confirmRegistration } from "../server/src/controllers/candidateController.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  enhanceReq(req);
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }
  return confirmRegistration(req, res);
}
