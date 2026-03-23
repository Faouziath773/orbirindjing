import {
  applyCors,
  handleOptions,
  enhanceReq,
  methodNotAllowed,
  runMiddleware,
} from "../_utils.js";
import {
  adminAuthMiddleware,
  listAdminCandidates,
} from "../../server/src/controllers/candidateController.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  enhanceReq(req);
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }
  await runMiddleware(req, res, adminAuthMiddleware);
  if (res.writableEnded) return;
  return listAdminCandidates(req, res);
}
