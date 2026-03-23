import crypto from "crypto";
import {
  applyCors,
  handleOptions,
  enhanceReq,
  parseJsonBody,
  readRawBody,
  methodNotAllowed,
} from "../_utils.js";
import { fetchTransaction } from "../../server/src/fedapay.js";
import { finalizeRegistration } from "../../server/src/services/registrationService.js";

function verifySignature(req) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  const signature = req.get("x-fedapay-signature");
  if (!signature || !req.rawBody) {
    return false;
  }

  const computed = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (signature.length !== computed.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(computed, "utf8")
  );
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (handleOptions(req, res)) return;
  enhanceReq(req);
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  if (!req.rawBody) {
    req.rawBody = await readRawBody(req);
  }
  req.body = await parseJsonBody(req);

  try {
    if (!verifySignature(req)) {
      return res.status(401).send("Invalid signature");
    }

    const payload = req.body?.data || req.body || {};
    const transactionId = payload.id || payload.transaction_id;
    if (!transactionId) {
      return res.status(400).send("Missing transaction id");
    }

    const transaction = await fetchTransaction(transactionId);
    if (!transaction) {
      return res.status(404).send("Transaction not found");
    }
    const result = await finalizeRegistration(transaction);

    if (result.status === "ignored") {
      return res.status(200).send("Ignored");
    }
    if (result.status === "no_pending") {
      return res.status(200).send("No pending registration");
    }
    if (result.status === "missing_transaction") {
      return res.status(400).send("Missing transaction id");
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send("Server error");
  }
}
