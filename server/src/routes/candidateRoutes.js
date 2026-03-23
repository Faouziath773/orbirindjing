import express from "express";
import {
  registerCandidate,
  confirmRegistration,
  validateRegistration,
  testDatabase,
  listAdminCandidates,
  getAdminStats,
  exportCandidatesCsv,
  adminAuthMiddleware,
  adminMasterMiddleware,
  verifyAdminAccess,
  listAdminAccessController,
  createAdminAccessController,
  deleteAdminAccessController,
} from "../controllers/candidateController.js";

const router = express.Router();

router.post("/register", registerCandidate);
router.get("/confirm", confirmRegistration);
router.post("/validate", validateRegistration);
router.get("/test-db", testDatabase);
router.post("/admin/verify", verifyAdminAccess);
router.get("/admin/candidates", adminAuthMiddleware, listAdminCandidates);
router.get("/admin/stats", adminAuthMiddleware, getAdminStats);
router.get("/admin/candidates.csv", adminAuthMiddleware, exportCandidatesCsv);
router.get("/admin/access", adminMasterMiddleware, listAdminAccessController);
router.post("/admin/access", adminMasterMiddleware, createAdminAccessController);
router.delete("/admin/access/:id", adminMasterMiddleware, deleteAdminAccessController);

export default router;
