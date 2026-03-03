import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("GET /accounts/:id", () => {
  it("returns 200 with account data for an existing account", async () => {
    const res = await request(app).get("/accounts/acc-001");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", "acc-001");
  });

  it("returns 404 for a nonexistent account ID", async () => {
    const res = await request(app).get("/accounts/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Account not found" });
  });
});
