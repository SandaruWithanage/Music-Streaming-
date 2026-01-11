/*// test/step6-playback.e2e-spec.ts
//
// ✅ Covers Step 6 requirements
// - POST /playback/events is protected
// - Playback events are stored
// - Resume position is persisted
// - Writes are non-blocking (endpoint responds immediately)
//
// ⚠️ Assumptions:
// - At least one Track exists in DB
// - Auth module is functional

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Step 6 — Playback Tracking [e2e]", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let jwt: string;
  let userId: string;
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

    // ─────────────────────────────
    // Create & login user
    // ─────────────────────────────
    const email = `e2e.playback.${Date.now()}@test.com`;
    const password = "password123";
    const displayName = "Playback Tester";

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, displayName })
      .expect((r) => {
        if (![200, 201].includes(r.status)) {
          throw new Error("Register failed");
        }
      });

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    jwt = login.body.accessToken ?? login.body.token ?? login.body.jwt;
    if (!jwt) throw new Error("JWT not returned");

    // Decode userId from DB (authoritative)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");
    userId = user.id;

    // ─────────────────────────────
    // Pick an existing track
    // ─────────────────────────────
    const track = await prisma.track.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!track) {
      throw new Error("No tracks available for playback test");
    }

    trackId = track.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated playback events (401)", async () => {
    await request(app.getHttpServer())
      .post("/playback/events")
      .send({ trackId, type: "START", positionMs: 0 })
      .expect(401);
  });

  it("accepts START event (non-blocking)", async () => {
    const start = Date.now();

    const res = await request(app.getHttpServer())
      .post("/playback/events")
      .set("Authorization", `Bearer ${jwt}`)
      .send({
        trackId,
        type: "START",
        positionMs: 0,
      })
      .expect(201);

    const duration = Date.now() - start;

    expect(res.body.ok).toBe(true);

    // Non-blocking: should return almost instantly
    expect(duration).toBeLessThan(200);
  });

  it("stores PROGRESS position for resume", async () => {
    await request(app.getHttpServer())
      .post("/playback/events")
      .set("Authorization", `Bearer ${jwt}`)
      .send({
        trackId,
        type: "PROGRESS",
        positionMs: 42_000,
      })
      .expect(201);

    const history = await prisma.listeningHistory.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
    });

    expect(history).toBeTruthy();
    expect(history!.lastPositionMs).toBe(42_000);
  });

  it("increments playCount on START", async () => {
    await request(app.getHttpServer())
      .post("/playback/events")
      .set("Authorization", `Bearer ${jwt}`)
      .send({
        trackId,
        type: "START",
        positionMs: 0,
      })
      .expect(201);

    const history = await prisma.listeningHistory.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
    });

    expect(history!.playCount).toBeGreaterThanOrEqual(1);
  });

  it("increments completedCount and resets position on END", async () => {
    await request(app.getHttpServer())
      .post("/playback/events")
      .set("Authorization", `Bearer ${jwt}`)
      .send({
        trackId,
        type: "END",
        positionMs: 180_000,
      })
      .expect(201);

    const history = await prisma.listeningHistory.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
    });

    expect(history!.completedCount).toBeGreaterThanOrEqual(1);
    expect(history!.lastPositionMs).toBe(0);
  });
});
*/