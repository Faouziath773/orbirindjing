import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";

describe("Test DB", () => {
  it("doit se connecter à Supabase et retourner un tableau", async () => {
    const res = await request(app).get("/api/test-db");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
