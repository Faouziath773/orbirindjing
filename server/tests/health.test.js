import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";

describe("Health", () => {
  it("doit retourner status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
