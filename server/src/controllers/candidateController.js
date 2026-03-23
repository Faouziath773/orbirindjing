import {
  createPendingRegistration,
  finalizeRegistration,
  findCandidateByPhone,
  findPendingByPhone,
  validatePendingRegistration,
} from "../services/registrationService.js";
import {
  listCandidates,
  getCandidateStats,
  testDatabaseConnection,
} from "../services/candidateService.js";
import {
  listAdminAccess,
  createAdminAccess,
  deleteAdminAccess,
  hasAdminCode,
} from "../services/adminService.js";
import {
  createTransaction,
  createTransactionToken,
  fetchTransaction,
} from "../fedapay.js";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  const raw = normalizeString(value);
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function getMasterAdminCode() {
  return (
    process.env.ADMIN_MASTER_CODE || process.env.VITE_ADMIN_CODE || ""
  ).trim();
}

function isAuthDisabled() {
  return !getMasterAdminCode();
}

function isMasterCode(code) {
  return Boolean(code && code === getMasterAdminCode());
}

async function isValidAdminCode(code) {
  if (!code) return false;
  if (isMasterCode(code)) return true;
  return hasAdminCode(code);
}

function extractAdminCode(req) {
  return String(req.get("x-admin-code") || req.body?.code || "").trim();
}

async function requireAdmin(req, res, next) {
  try {
    if (isAuthDisabled()) {
      return next();
    }
    const code = extractAdminCode(req);
    const isValid = await isValidAdminCode(code);
    if (!isValid) {
      return res.status(401).json({ error: "Code admin invalide." });
    }
    req.adminCode = code;
    req.isMaster = isMasterCode(code);
    return next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

async function requireMaster(req, res, next) {
  await requireAdmin(req, res, () => {
    if (isAuthDisabled()) {
      return next();
    }
    if (!req.isMaster) {
      return res.status(403).json({ error: "Accès réservé à l'admin principal." });
    }
    return next();
  });
}

export async function registerCandidate(req, res) {
  try {
    console.info("Register request received");
    const { first_name, last_name, phone, email, age, city, motivation } =
      req.body || {};

    const cleaned = {
      first_name: normalizeString(first_name),
      last_name: normalizeString(last_name),
      phone: normalizePhone(phone),
      email: normalizeString(email),
      age: Number(age),
      city: normalizeString(city),
      motivation: normalizeString(motivation),
    };

    console.info("Register payload summary", {
      hasFirstName: Boolean(cleaned.first_name),
      hasLastName: Boolean(cleaned.last_name),
      hasPhone: Boolean(cleaned.phone),
      hasEmail: Boolean(cleaned.email),
      age: cleaned.age,
      cityLength: cleaned.city.length,
    });

    if (
      !cleaned.first_name ||
      !cleaned.last_name ||
      !cleaned.phone ||
      !Number.isFinite(cleaned.age) ||
      !cleaned.city
    ) {
      return res.status(400).json({ error: "Champs obligatoires manquants." });
    }

    const existingCandidate = await findCandidateByPhone(cleaned.phone);
    const existingPending = await findPendingByPhone(cleaned.phone);

    if (existingCandidate || existingPending) {
      return res
        .status(409)
        .json({ error: "Une inscription existe déjà pour ce numéro." });
    }

    const isTestMode = process.env.NODE_ENV === "test";
    if (isTestMode) {
      const transactionId =
        normalizeString(req.body?.transaction_id) ||
        `test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      await createPendingRegistration({
        first_name: cleaned.first_name,
        last_name: cleaned.last_name,
        phone: cleaned.phone,
        email: cleaned.email || null,
        age: cleaned.age,
        city: cleaned.city,
        motivation: cleaned.motivation || null,
        transaction_id: transactionId,
      });

      return res.status(201).json({
        success: true,
        transaction_id: transactionId,
      });
    }

    console.info("Creating FedaPay transaction");
    const transaction = await createTransaction({
      description: "Inscription au programme DJ",
      amount: 1000,
      currency: "XOF",
    });

    if (!transaction?.id) {
      console.warn("FedaPay transaction missing id", transaction);
      return res
        .status(502)
        .json({ error: "Impossible de créer la transaction." });
    }

    const paymentUrl = transaction.payment_url;
    if (!paymentUrl) {
      console.info("Creating FedaPay token", { transactionId: transaction.id });
      const token = await createTransactionToken(transaction.id);
      if (!token?.url) {
        console.warn("FedaPay token missing url", token);
        return res
          .status(502)
          .json({ error: "Impossible de générer le lien de paiement." });
      }
      transaction.payment_url = token.url;
    }

    await createPendingRegistration({
      first_name: cleaned.first_name,
      last_name: cleaned.last_name,
      phone: cleaned.phone,
      email: cleaned.email || null,
      age: cleaned.age,
      city: cleaned.city,
      motivation: cleaned.motivation || null,
      transaction_id: transaction.id,
    });

    return res.status(201).json({
      payment_url: transaction.payment_url,
      transaction_id: transaction.id,
    });
  } catch (error) {
    if (error?.response) {
      const requestId = error.response?.headers?.["x-request-id"];
      console.error("Register error:", error.response?.data || error.response);
      return res.status(502).json({
        error: "Erreur FedaPay.",
        details: error.response?.data || null,
        request_id: requestId || null,
      });
    }
    if (error?.code === "23505") {
      return res
        .status(409)
        .json({ error: "Une inscription existe déjà." });
    }
    console.error("Register error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function confirmRegistration(req, res) {
  try {
    const transactionId = String(req.query.transaction_id || "").trim();
    if (!transactionId) {
      return res.status(400).json({ error: "Transaction manquante." });
    }

    const transaction = await fetchTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction introuvable." });
    }

    const result = await finalizeRegistration(transaction);
    return res.json({
      data: {
        status: result.status,
        transaction_status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Confirm error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function validateRegistration(req, res) {
  try {
    const transactionId = String(req.body?.transaction_id || "").trim();
    if (!transactionId) {
      return res.status(400).json({ error: "Transaction manquante." });
    }

    const result = await validatePendingRegistration(transactionId);

    if (result.status === "not_found") {
      return res.status(404).json({ error: "Transaction introuvable." });
    }
    if (result.status === "duplicate") {
      return res.status(409).json({ error: "Transaction déjà validée." });
    }
    if (result.status === "missing_transaction") {
      return res.status(400).json({ error: "Transaction manquante." });
    }

    return res.json({ success: true, status: result.status });
  } catch (error) {
    console.error("Validate error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function testDatabase(req, res) {
  try {
    const data = await testDatabaseConnection();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Test DB error:", error);
    return res.status(500).json({ success: false, error: "Erreur base." });
  }
}

export async function listAdminCandidates(req, res) {
  try {
    const search = String(req.query.search || "").trim().toLowerCase();
    const candidates = await listCandidates({ search });
    return res.json({ data: candidates });
  } catch (error) {
    console.error("Admin list error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function getAdminStats(_req, res) {
  try {
    const stats = await getCandidateStats();
    return res.json({ data: stats });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function exportCandidatesCsv(_req, res) {
  try {
    const candidates = await listCandidates();

    const headers = ["Nom", "Telephone", "Ville", "Age", "Date"];

    const rows = candidates.map((candidate) => [
      `${candidate.first_name} ${candidate.last_name}`,
      candidate.phone,
      candidate.city,
      candidate.age,
      candidate.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="candidates.csv"'
    );
    return res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export const adminAuthMiddleware = requireAdmin;
export const adminMasterMiddleware = requireMaster;

export async function verifyAdminAccess(req, res) {
  try {
    if (isAuthDisabled()) {
      return res.json({ success: true, is_master: true });
    }
    const code = extractAdminCode(req);
    const isValid = await isValidAdminCode(code);
    if (!isValid) {
      return res.status(401).json({ error: "Code admin invalide." });
    }
    return res.json({ success: true, is_master: isMasterCode(code) });
  } catch (error) {
    console.error("Admin verify error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function listAdminAccessController(_req, res) {
  try {
    const admins = await listAdminAccess();
    return res.json({ data: admins });
  } catch (error) {
    console.error("Admin list error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function createAdminAccessController(req, res) {
  try {
    const name = normalizeString(req.body?.name);
    const code = normalizeString(req.body?.code);
    if (!code) {
      return res.status(400).json({ error: "Code manquant." });
    }
    await createAdminAccess({ name, code });
    return res.status(201).json({ success: true });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Ce code existe déjà." });
    }
    console.error("Admin create error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function deleteAdminAccessController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Identifiant invalide." });
    }
    await deleteAdminAccess(id);
    return res.json({ success: true });
  } catch (error) {
    console.error("Admin delete error:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
