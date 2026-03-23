import request from "supertest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import app from "../src/app.js";
import { cleanupTestData, buildTestPayload } from "./utils.js";

describe("Registration", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("doit insérer une pré-inscription valide", async () => {
    const transactionId = `test_${Date.now()}_reg`;
    const payload = buildTestPayload({ transaction_id: transactionId });
    const res = await request(app).post("/api/register").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction_id).toBe(transactionId);
  });

  it("doit échouer si des champs manquent", async () => {
    const res = await request(app).post("/api/register").send({
      first_name: "Test",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
