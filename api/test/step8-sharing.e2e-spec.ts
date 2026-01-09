// test/step8-sharing.e2e-spec.ts
//
// ✅ Step 8 — Sharing / Collaboration Module [e2e]
//
// Covers:
// ✅ POST /playlists/:id/share
// ✅ GET /share/:token
// ✅ POST /playlists/:id/collaborators
// ✅ DELETE /playlists/:id/collaborators/:userId
// ✅ Token expiry behavior
// ✅ Owner-only collaborator management
// ✅ Edit access enforcement (owner/edit collaborator can mutate; view collaborator cannot)
//
// Assumptions based on your current backend:
// - JWT payload puts userId at req.user.userId (you fixed getUserId)
// - PlaylistService uses canViewPlaylist / canEditPlaylist
// - Public share endpoint is /share/:token and does NOT require auth
// - Share create endpoint is protected (JwtAuthGuard) and owner-only
//
// Notes:
// - Status codes may vary (200 vs 201). This test accepts either where appropriate.
// - If your share create response returns { url, expiresAt }, we parse token from url.
// - Needs at least 1 active track in DB to add into playlist.

import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

function expect200or201(status: number) {
  expect([200, 201].includes(status)).toBe(true);
}

function getJwt(body: any): string {
  const jwt = body?.accessToken ?? body?.token ?? body?.jwt;
  if (!jwt) throw new Error("JWT missing from login response");
  return jwt;
}

function extractTokenFromUrl(url: string): string {
  // expected: http://localhost:3000/share/<token>
  const parts = url.split("/share/");
  if (parts.length !== 2 || !parts[1]) throw new Error("Invalid share url");
  return parts[1];
}

describe("Step 8 — Sharing / Collaboration [e2e]", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Users
  let ownerJwt: string;
  let ownerId: string;

  let otherJwt: string;
  let otherId: string;

  // Data
  let playlistId: string;
  let trackId: string;

  // Share tokens
  let viewToken: string;
  let editToken: string;

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

    // ──────────────────────────────────────────────────────────────
    // Ensure we have at least 1 track to add into playlist
    // ──────────────────────────────────────────────────────────────
    const track = await prisma.track.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!track) throw new Error("Need at least 1 active track in DB for Step 8 tests");
    trackId = track.id;

    // ──────────────────────────────────────────────────────────────
    // Create 2 users: owner + other
    // ──────────────────────────────────────────────────────────────
    const ownerEmail = `e2e.owner.${Date.now()}@test.com`;
    const otherEmail = `e2e.other.${Date.now()}@test.com`;
    const password = "password123";

    // Register owner
    const regOwner = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: ownerEmail, password, displayName: "Owner User" });

    expect200or201(regOwner.status);

    // Login owner
    const loginOwner = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: ownerEmail, password })
      .expect(200);
    ownerJwt = getJwt(loginOwner.body);

    const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!owner) throw new Error("Owner user not found in DB");
    ownerId = owner.id;

    // Register other
    const regOther = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email: otherEmail, password, displayName: "Other User" });

    expect200or201(regOther.status);

    // Login other
    const loginOther = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: otherEmail, password })
      .expect(200);
    otherJwt = getJwt(loginOther.body);

    const other = await prisma.user.findUnique({ where: { email: otherEmail } });
    if (!other) throw new Error("Other user not found in DB");
    otherId = other.id;

    // ──────────────────────────────────────────────────────────────
    // Create playlist as owner and add one item
    // ──────────────────────────────────────────────────────────────
    const createPlaylist = await request(app.getHttpServer())
      .post("/playlists")
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({ name: "Step8 Playlist" });

    expect200or201(createPlaylist.status);
    playlistId = createPlaylist.body.id;

    await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/items`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({ trackId })
      .expect((r) => expect200or201(r.status));
  });

  afterAll(async () => {
    await app.close();
  });

  // ──────────────────────────────────────────────────────────────
  // 8.1 Share token creation
  // ──────────────────────────────────────────────────────────────
  it("creates a VIEW share link (POST /playlists/:id/share)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/share`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({
        accessLevel: "VIEW",
        expiresAt: "2099-01-01T00:00:00.000Z",
      })
      .expect((r) => expect200or201(r.status));

    expect(res.body.url).toContain("/share/");
    viewToken = extractTokenFromUrl(res.body.url);

    const shareRow = await prisma.playlistShare.findUnique({
      where: { token: viewToken },
    });
    expect(shareRow).not.toBeNull();
    expect(shareRow?.playlistId).toBe(playlistId);
    expect(shareRow?.accessLevel).toBe("VIEW");
  });

  it("creates an EDIT share link (POST /playlists/:id/share)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/share`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({
        accessLevel: "EDIT",
        expiresAt: "2099-01-01T00:00:00.000Z",
      })
      .expect((r) => expect200or201(r.status));

    expect(res.body.url).toContain("/share/");
    editToken = extractTokenFromUrl(res.body.url);

    const shareRow = await prisma.playlistShare.findUnique({
      where: { token: editToken },
    });
    expect(shareRow).not.toBeNull();
    expect(shareRow?.playlistId).toBe(playlistId);
    expect(shareRow?.accessLevel).toBe("EDIT");
  });

  it("rejects share creation by NON-owner (403)", async () => {
    await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/share`)
      .set("Authorization", `Bearer ${otherJwt}`)
      .send({ accessLevel: "VIEW" })
      .expect(403);
  });

  // ──────────────────────────────────────────────────────────────
  // 8.2 Public share endpoint
  // ──────────────────────────────────────────────────────────────
  it("fetches shared playlist publicly (GET /share/:token) - VIEW token", async () => {
    const res = await request(app.getHttpServer())
      .get(`/share/${viewToken}`)
      .expect(200);

    expect(res.body.token).toBe(viewToken);
    expect(res.body.accessLevel).toBe("VIEW");
    expect(res.body.playlist).toBeDefined();
    expect(res.body.playlist.id).toBe(playlistId);

    // playlist includes ordered items
    expect(Array.isArray(res.body.playlist.items)).toBe(true);
    if (res.body.playlist.items.length > 0) {
      // must be sorted
      const positions = res.body.playlist.items.map((i: any) => i.position);
      expect([...positions].sort((a: number, b: number) => a - b)).toEqual(positions);
    }
  });

  it("returns 410 Gone for expired token", async () => {
    // Create an already-expired token directly in DB (clean + deterministic)
    const expired = await prisma.playlistShare.create({
      data: {
        playlistId,
        token: `expired${Date.now()}`, // unique
        accessLevel: "VIEW",
        expiresAt: new Date(Date.now() - 60_000), // 1 min in past
      },
    });

    await request(app.getHttpServer())
      .get(`/share/${expired.token}`)
      .expect(410);
  });

  it("returns 404 for unknown token", async () => {
    await request(app.getHttpServer())
      .get(`/share/notarealtoken${Date.now()}`)
      .expect(404);
  });

  // ──────────────────────────────────────────────────────────────
  // 8.3 Collaborator management (owner-only)
  // ──────────────────────────────────────────────────────────────
  it("owner adds collaborator (POST /playlists/:id/collaborators)", async () => {
    const res = await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/collaborators`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({ userId: otherId, permission: "EDIT" })
      .expect((r) => expect200or201(r.status));

    // row exists
    const row = await prisma.playlistCollaborator.findUnique({
      where: { playlistId_userId: { playlistId, userId: otherId } },
    });
    expect(row).not.toBeNull();
    expect(row?.permission).toBe("EDIT");

    // response shape may vary; don't hard lock to it
    expect(res.body).toBeDefined();
  });

  it("non-owner cannot add collaborator (403)", async () => {
    await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/collaborators`)
      .set("Authorization", `Bearer ${otherJwt}`)
      .send({ userId: ownerId, permission: "VIEW" })
      .expect(403);
  });

  it("duplicate collaborator add fails (unique constraint)", async () => {
    // adding same collaborator again should fail
    // Depending on your exception filter, this might be 409 or 400 or 500.
    // We assert "not success" and verify DB still has only one row.
    const res = await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/collaborators`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({ userId: otherId, permission: "EDIT" });

    expect([200, 201].includes(res.status)).toBe(false);

    const rows = await prisma.playlistCollaborator.findMany({
      where: { playlistId, userId: otherId },
    });
    expect(rows.length).toBe(1);
  });

  it("owner removes collaborator (DELETE /playlists/:id/collaborators/:userId)", async () => {
    await request(app.getHttpServer())
      .delete(`/playlists/${playlistId}/collaborators/${otherId}`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .expect((r) => expect([200, 204].includes(r.status)).toBe(true));

    const row = await prisma.playlistCollaborator.findUnique({
      where: { playlistId_userId: { playlistId, userId: otherId } },
    });
    expect(row).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // 8.4 Edit access enforcement (critical stop condition)
  // ──────────────────────────────────────────────────────────────
  it("VIEW collaborator cannot edit playlist (403)", async () => {
    // add other user back as VIEW collaborator
    await request(app.getHttpServer())
      .post(`/playlists/${playlistId}/collaborators`)
      .set("Authorization", `Bearer ${ownerJwt}`)
      .send({ userId: otherId, permission: "VIEW" })
      .expect((r) => expect200or201(r.status));

    // other tries to update playlist name -> must fail
    await request(app.getHttpServer())
      .patch(`/playlists/${playlistId}`)
      .set("Authorization", `Bearer ${otherJwt}`)
      .send({ name: "Should Not Work" })
      .expect(403);

    // other tries to reorder -> must fail
    const items = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    if (items.length >= 1) {
      await request(app.getHttpServer())
        .patch(`/playlists/${playlistId}/reorder`)
        .set("Authorization", `Bearer ${otherJwt}`)
        .send({ orderedItemIds: items.map(i => i.id) })
        .expect(403);
    }
  });

  it("EDIT collaborator can edit playlist (200/201)", async () => {
    // upgrade collaborator to EDIT
    await prisma.playlistCollaborator.update({
      where: { playlistId_userId: { playlistId, userId: otherId } },
      data: { permission: "EDIT" },
    });

    const res = await request(app.getHttpServer())
      .patch(`/playlists/${playlistId}`)
      .set("Authorization", `Bearer ${otherJwt}`)
      .send({ name: "Edited By Collaborator" });

    expect([200, 201].includes(res.status)).toBe(true);

    const updated = await prisma.playlist.findUnique({ where: { id: playlistId } });
    expect(updated?.name).toBe("Edited By Collaborator");
  });

  it("everyone else (no collab) is forbidden for protected playlist endpoints", async () => {
    // Create a third user with no access
    const email = `e2e.third.${Date.now()}@test.com`;
    const password = "password123";

    const reg = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, displayName: "Third User" });
    expect200or201(reg.status);

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);
    const thirdJwt = getJwt(login.body);

    await request(app.getHttpServer())
      .get(`/playlists/${playlistId}`)
      .set("Authorization", `Bearer ${thirdJwt}`)
      .expect(403);

    // But share endpoint should still work without auth
    await request(app.getHttpServer())
      .get(`/share/${viewToken}`)
      .expect(200);
  });
});
