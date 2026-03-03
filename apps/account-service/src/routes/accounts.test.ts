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

describe("POST /accounts/bulk-lookup", () => {
  it("returns matching accounts for valid IDs", async () => {
    const res = await request(app)
      .post("/accounts/bulk-lookup")
      .send({ ids: ["acc-001", "acc-002"] });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty("id", "acc-001");
    expect(res.body.data[1]).toHaveProperty("id", "acc-002");
  });

  it("returns only found accounts when some IDs do not exist", async () => {
    const res = await request(app)
      .post("/accounts/bulk-lookup")
      .send({ ids: ["acc-001", "nonexistent-id", "acc-003"] });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((a: { id: string }) => a.id)).toEqual([
      "acc-001",
      "acc-003",
    ]);
  });

  it("returns an empty array when given an empty ids array", async () => {
    const res = await request(app)
      .post("/accounts/bulk-lookup")
      .send({ ids: [] });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("returns 400 when ids is not an array", async () => {
    const res = await request(app)
      .post("/accounts/bulk-lookup")
      .send({ ids: "acc-001" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "ids must be an array" });
  });

  it("returns 400 when ids array exceeds max length", async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `acc-${i}`);
    const res = await request(app)
      .post("/accounts/bulk-lookup")
      .send({ ids });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "ids array must not exceed 50 items",
    });
  });

  it("returns account data with the same shape as single lookup", async () => {
    const singleRes = await request(app).get("/accounts/acc-001");
    const bulkRes = await request(app)
      .post("/accounts/bulk-lookup")
      .send({ ids: ["acc-001"] });
    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.data).toHaveLength(1);
    expect(Object.keys(bulkRes.body.data[0]).sort()).toEqual(
      Object.keys(singleRes.body.data).sort()
    );
  });
});
