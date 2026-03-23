import request from "supertest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import app from "../src/app.js";
import { supabase } from "../src/lib/supabase.js";
import { cleanupTestData, buildTestPayload } from "./utils.js";

describe("Validation", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("doit déplacer un candidat de pending vers candidates", async () => {
    const transactionId = `test_${Date.now()}_val`;
    const payload = buildTestPayload({ transaction_id: transactionId });
    await request(app).post("/api/register").send(payload);

    const res = await request(app)
      .post("/api/validate")
      .send({ transaction_id: transactionId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data: pending } = await supabase
      .from("pending_registrations")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    expect(pending).toBeNull();
    expect(candidate).not.toBeNull();
  });

  it("doit échouer si la transaction n'existe pas", async () => {
    const res = await request(app)
      .post("/api/validate")
      .send({ transaction_id: "test_missing_tx" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
