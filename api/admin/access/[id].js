import {
  applyCors,
  handleOptions,
  enhanceReq,
  methodNotAllowed,
  runMiddleware,
} from "../../_utils.js";
import {
  adminMasterMiddleware,
  deleteAdminAccessController,
} from "../../../server/src/controllers/candidateController.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  enhanceReq(req);
  if (req.method !== "DELETE") {
    return methodNotAllowed(res, ["DELETE"]);
  }
  await runMiddleware(req, res, adminMasterMiddleware);
  if (res.writableEnded) return;
  return deleteAdminAccessController(req, res);
}
