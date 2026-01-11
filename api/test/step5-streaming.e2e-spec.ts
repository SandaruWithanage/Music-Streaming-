/*// test/step5-streaming.e2e-spec.ts
//
// ✅ What this test covers (Step 5 requirements)
// - Authenticated access check: /tracks/:id/stream must be protected (401 without JWT)
// - Signed URL generation: returns { url, expiresAt }
// - No public asset exposure: media URL should require token (401 if token is tampered)
// - Range support sanity check: media endpoint should support Range (usually 206)
//
// ⚠️ IMPORTANT (fact-based):
// This test can only fully pass if your DB has at least ONE active Track whose AudioAsset
// points to a REAL audio file that StreamingService can read.
// If your storageKey/file mapping isn’t available in test environment, the “media fetch”
// checks may fail (that’s an environment issue, not the API contract).

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("Step 5 — Streaming Module (Signed URLs or Stream Endpoint) [e2e]", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let jwt: string;
  let trackId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // 1) Ensure we have a valid JWT user
    // (We use unique email per run so tests are repeatable.)
    const email = `e2e.streaming.${Date.now()}@test.com`;
    const password = "password123"; // must satisfy your RegisterDto min length 6
    const displayName = "E2E Streaming User";

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, displayName })
      .expect((r) => {
        // some apps return 201, some 200
        if (![200, 201].includes(r.status)) {
          throw new Error(`Expected 200/201, got ${r.status}`);
        }
      });

    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    // Your JWT payload extraction uses req.user.userId,
    // but login response shape could be { accessToken } or { token }.
    jwt = loginRes.body.accessToken ?? loginRes.body.token ?? loginRes.body.jwt;
    if (!jwt) throw new Error("Login did not return a JWT (accessToken/token/jwt missing)");

    // 2) Pick an existing track from DB (we do NOT create files here)
    const anyTrack = await prisma.track.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (!anyTrack) {
      throw new Error(
        "No tracks found in DB. Step 4/seed data must exist before Step 5 can be tested.",
      );
    }

    trackId = anyTrack.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated access to GET /tracks/:id/stream (401)", async () => {
    await request(app.getHttpServer()).get(`/tracks/${trackId}/stream`).expect(401);
  });

  it("returns a signed media URL + expiresAt when authenticated", async () => {
    const res = await request(app.getHttpServer())
      .get(`/tracks/${trackId}/stream`)
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    expect(res.body).toBeTruthy();
    expect(typeof res.body.url).toBe("string");
    expect(res.body.url).toContain("/media/");
    expect(res.body.url).toContain("token=");

    // expiresAt should be a valid date/time string (or ISO)
    expect(res.body.expiresAt).toBeTruthy();
    const exp = new Date(res.body.expiresAt).getTime();
    expect(Number.isNaN(exp)).toBe(false);

    // "Short expiration policy" sanity check:
    // We don't assume exact TTL, but expiresAt should be in the future.
    expect(exp).toBeGreaterThan(Date.now());
  });

  it("media URL should NOT be usable if token is tampered (401)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/tracks/${trackId}/stream`)
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    const url: string = res.body.url;

    // Tamper token: change last character
    const tampered = url.replace(/token=([^&]+)/, (_m, token) => {
      const t = String(token);
      const last = t.slice(-1);
      const flipped = last === "a" ? "b" : "a";
      return `token=${t.slice(0, -1)}${flipped}`;
    });

    // We call the absolute URL via supertest by extracting just the path+query
    const u = new URL(tampered);
    await request(app.getHttpServer()).get(u.pathname + u.search).expect(401);
  });

  it("media endpoint should support Range requests (usually 206) and return audio content-type", async () => {
    const res = await request(app.getHttpServer())
      .get(`/tracks/${trackId}/stream`)
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    const url: string = res.body.url;
    const u = new URL(url);

    const mediaRes = await request(app.getHttpServer())
      .get(u.pathname + u.search)
      .set("Range", "bytes=0-1")
      .expect((r) => {
        // implementations vary:
        // - some return 206 Partial Content for Range
        // - some may return 200 but still include Accept-Ranges
        if (![200, 206].includes(r.status)) {
          throw new Error(`Expected 200/206, got ${r.status}`);
        }
      });

    // Headers sanity
    const ct = String(mediaRes.headers["content-type"] ?? "");
    expect(ct.toLowerCase()).toContain("audio"); // e.g. audio/mpeg
    const acceptRanges = String(mediaRes.headers["accept-ranges"] ?? "");
    // Accept-Ranges may be set by your service; if missing, Range still might work.
    // But in your controllers you set Accept-Ranges: bytes, so we expect it.
    expect(acceptRanges.toLowerCase()).toContain("bytes");
  });

  it("expiry behavior: after expiration, media URL should fail (401). (optional real wait)", async () => {
    // This is the only truly “fact-based” way to test expiry without changing code:
    // wait longer than TTL and retry.
    //
    // ⚠️ It makes the suite slower. You can disable it by setting:
    // E2E_STREAM_EXPIRY_TEST=false
    if (process.env.E2E_STREAM_EXPIRY_TEST === "false") {
      return;
    }

    const res = await request(app.getHttpServer())
      .get(`/tracks/${trackId}/stream`)
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    const url: string = res.body.url;
    const expiresAt = new Date(res.body.expiresAt).getTime();

    // Wait until just after expiresAt (with a safety cushion).
    const waitMs = Math.max(0, expiresAt - Date.now() + 1500);

    // If your TTL is large (minutes), you probably don't want to wait.
    // We'll cap waiting to 70 seconds to keep test practical.
    // If TTL > 70s, this test becomes “inconclusive” (it will likely still work).
    const capped = Math.min(waitMs, 70_000);
    await sleep(capped);

    const u = new URL(url);
    const after = await request(app.getHttpServer()).get(u.pathname + u.search);

    // If TTL <= ~70s, we expect it to be expired and return 401.
    // If TTL is longer, after.status might still be 200/206 — that's fine.
    if (waitMs <= 70_000) {
      expect(after.status).toBe(401);
    } else {
      // TTL longer than our cap, so we just assert it still behaves sanely (not 500).
      expect([200, 206, 401, 403, 404]).toContain(after.status);
    }
  }, 120_000); // allow slow expiry test
});
*/