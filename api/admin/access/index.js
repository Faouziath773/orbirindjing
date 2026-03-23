import {
  applyCors,
  handleOptions,
  enhanceReq,
  parseJsonBody,
  methodNotAllowed,
  runMiddleware,
} from "../../_utils.js";
import {
  adminMasterMiddleware,
  listAdminAccessController,
  createAdminAccessController,
} from "../../../server/src/controllers/candidateController.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  enhanceReq(req);
  if (req.method === "GET") {
    await runMiddleware(req, res, adminMasterMiddleware);
    if (res.writableEnded) return;
    return listAdminAccessController(req, res);
  }
  if (req.method === "POST") {
    await runMiddleware(req, res, adminMasterMiddleware);
    if (res.writableEnded) return;
    req.body = await parseJsonBody(req);
    return createAdminAccessController(req, res);
  }
  return methodNotAllowed(res, ["GET", "POST"]);
}
