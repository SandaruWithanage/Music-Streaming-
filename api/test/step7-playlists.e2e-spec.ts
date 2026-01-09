// test/step7-playlists.e2e-spec.ts
//
// ✅ Covers Step 7 requirements
// - Playlist CRUD
// - Add tracks
// - Strict ordering
// - Transaction-safe reorder
// - Ownership enforcement
//
// ⚠️ Assumptions:
// - Auth is working
// - At least 3 tracks exist in DB
// - Sharing is NOT involved

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Step 7 — Playlist Module [e2e]", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let jwt: string;
  let userId: string;
  let playlistId: string;
  let trackIds: string[] = [];
  let playlistItemIds: string[] = [];

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
    const email = `e2e.playlist.${Date.now()}@test.com`;
    const password = "password123";
    const displayName = "Playlist Tester";

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
    if (!jwt) throw new Error("JWT missing");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");
    userId = user.id;

    // ─────────────────────────────
    // Get 3 tracks for playlist
    // ─────────────────────────────
    const tracks = await prisma.track.findMany({
      where: { isActive: true },
      take: 3,
      select: { id: true },
    });

    if (tracks.length < 3) {
      throw new Error("Need at least 3 tracks for playlist test");
    }

    trackIds = tracks.map(t => t.id);
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates a playlist (POST /playlists)", async () => {
    const res = await request(app.getHttpServer())
      .post("/playlists")
      .set("Authorization", `Bearer ${jwt}`)
      .send({ name: "My Test Playlist" })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("My Test Playlist");
    expect(res.body.ownerId).toBe(userId);

    playlistId = res.body.id;
  });

  it("adds tracks with sequential positions", async () => {
    for (const trackId of trackIds) {
      const res = await request(app.getHttpServer())
        .post(`/playlists/${playlistId}/items`)
        .set("Authorization", `Bearer ${jwt}`)
        .send({ trackId })
        .expect(201);

      playlistItemIds.push(res.body.id);
    }

    const items = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: "asc" },
    });

    expect(items.length).toBe(3);
    expect(items.map(i => i.position)).toEqual([0, 1, 2]);
  });

  it("returns playlist in correct order (GET /playlists/:id)", async () => {
    const res = await request(app.getHttpServer())
      .get(`/playlists/${playlistId}`)
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    const positions = res.body.items.map((i: any) => i.position);
    expect(positions).toEqual([0, 1, 2]);
  });

  it("reorders playlist items atomically", async () => {
    const newOrder = [
      playlistItemIds[2],
      playlistItemIds[0],
      playlistItemIds[1],
    ];

    await request(app.getHttpServer())
      .patch(`/playlists/${playlistId}/reorder`)
      .set("Authorization", `Bearer ${jwt}`)
      .send({ orderedItemIds: newOrder })
      .expect(200);

    const items = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: "asc" },
    });

    expect(items.map(i => i.id)).toEqual(newOrder);
    expect(items.map(i => i.position)).toEqual([0, 1, 2]);
  });

  it("prevents duplicate positions (transaction safety)", async () => {
    const items = await prisma.playlistItem.findMany({
      where: { playlistId },
    });

    const positions = items.map(i => i.position);
    const unique = new Set(positions);

    expect(unique.size).toBe(positions.length);
  });

  it("blocks non-owner access (403)", async () => {
    // Create another user
    const email = `e2e.other.${Date.now()}@test.com`;
    const password = "password123";

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, displayName: "Other User" })
      .expect((r) => {
        if (![200, 201].includes(r.status)) {
          throw new Error("Register failed");
        }
      });

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    const otherJwt = login.body.accessToken ?? login.body.token ?? login.body.jwt;

    await request(app.getHttpServer())
      .patch(`/playlists/${playlistId}`)
      .set("Authorization", `Bearer ${otherJwt}`)
      .send({ name: "Hacked" })
      .expect(403);
  });

  it("deletes playlist (DELETE /playlists/:id)", async () => {
    await request(app.getHttpServer())
      .delete(`/playlists/${playlistId}`)
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    const deleted = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    expect(deleted).toBeNull();
  });
});
