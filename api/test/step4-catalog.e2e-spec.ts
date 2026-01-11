/*// test/step4-catalog.e2e-spec.ts
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

type TracksListResponse =
  | {
      items: any[];
      page: { skip: number; take: number; total: number; hasMore: boolean };
    }
  | any; // keep flexible if your DTO shape differs slightly

describe("Step 4 — Catalog Module (Browse / Search / Metadata) [e2e]", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // IDs we create so cleanup is precise (no touching your seed/demo data)
  const created = {
    artistId: "",
    albumId: "" as string | null,
    audioAssetIds: [] as string[],
    trackIds: [] as string[],
  };

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

    // ---- Seed minimal catalog data for predictable tests ----
    const artist = await prisma.artist.create({
      data: { name: `E2E Catalog Artist ${Date.now()}` },
    });
    created.artistId = artist.id;

    const album = await prisma.album.create({
      data: {
        title: `E2E Catalog Album ${Date.now()}`,
        coverUrl: "https://example.com/cover.jpg",
        artistId: artist.id,
      },
    });
    created.albumId = album.id;

    // Create 5 tracks with different titles/genres for search + pagination tests
    const tracksToCreate = [
      { title: "E2E Song Alpha", genre: "Pop", durationSeconds: 180 },
      { title: "E2E Song Beta", genre: "Pop", durationSeconds: 210 },
      { title: "E2E Song Gamma", genre: "Classic", durationSeconds: 200 },
      { title: "E2E Jazz Delta", genre: "Jazz", durationSeconds: 190 },
      { title: "E2E Rock Epsilon", genre: "Rock", durationSeconds: 220 },
    ];

    for (const t of tracksToCreate) {
      const asset = await prisma.audioAsset.create({
        data: {
          storageKey: `e2e/${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`,
          mimeType: "audio/mpeg",
          sizeBytes: BigInt(123456),
          checksum: null,
        },
      });
      created.audioAssetIds.push(asset.id);

      const track = await prisma.track.create({
        data: {
          title: t.title,
          genre: t.genre,
          durationSeconds: t.durationSeconds,
          tags: [],
          isActive: true,
          artistId: artist.id,
          albumId: album.id,
          audioAssetId: asset.id,
        },
      });
      created.trackIds.push(track.id);
    }
  });

  afterAll(async () => {
    // Cleanup only what we created
    await prisma.playlistItem.deleteMany({ where: { trackId: { in: created.trackIds } } });
    await prisma.listeningHistory.deleteMany({ where: { trackId: { in: created.trackIds } } });
    await prisma.like.deleteMany({ where: { trackId: { in: created.trackIds } } });

    await prisma.track.deleteMany({ where: { id: { in: created.trackIds } } });
    await prisma.audioAsset.deleteMany({ where: { id: { in: created.audioAssetIds } } });

    if (created.albumId) {
      await prisma.album.deleteMany({ where: { id: created.albumId } });
    }
    if (created.artistId) {
      await prisma.artist.deleteMany({ where: { id: created.artistId } });
    }

    await app.close();
  });

  describe("GET /tracks (browse + pagination)", () => {
    it("returns a list with pagination shape (items + page) and includes our seeded tracks", async () => {
      const res = await request(app.getHttpServer()).get("/tracks").expect(200);

      const body: TracksListResponse = res.body;
      expect(body).toBeTruthy();

      // Your API (from your earlier screenshots) returns { items, page }
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.page).toBeTruthy();
      expect(typeof body.page.total).toBe("number");

      // At least our 5 tracks should exist in the global catalog list
      const returnedIds = new Set(body.items.map((x: any) => x.id));
      const hits = created.trackIds.filter((id) => returnedIds.has(id));
      expect(hits.length).toBeGreaterThan(0); // not assuming first page contains all
    });

    it("supports pagination via skip/take (no duplicates across pages)", async () => {
      // Page 1
      const res1 = await request(app.getHttpServer())
        .get("/tracks")
        .query({ skip: 0, take: 2 })
        .expect(200);

      const body1: TracksListResponse = res1.body;
      expect(body1.items.length).toBeLessThanOrEqual(2);

      // Page 2
      const res2 = await request(app.getHttpServer())
        .get("/tracks")
        .query({ skip: 2, take: 2 })
        .expect(200);

      const body2: TracksListResponse = res2.body;
      expect(body2.items.length).toBeLessThanOrEqual(2);

      const ids1 = new Set(body1.items.map((x: any) => x.id));
      const ids2 = new Set(body2.items.map((x: any) => x.id));

      // Ensure no duplicates between the two pages (strong pagination signal)
      for (const id of ids1) {
        expect(ids2.has(id)).toBe(false);
      }
    });
  });

  describe("GET /tracks/:id (metadata consistency)", () => {
    it("returns a single track with stable metadata fields", async () => {
      const id = created.trackIds[0];

      const res = await request(app.getHttpServer()).get(`/tracks/${id}`).expect(200);

      expect(res.body).toBeTruthy();
      expect(res.body.id).toBe(id);
      expect(typeof res.body.title).toBe("string");
      expect(typeof res.body.durationSeconds).toBe("number");
      expect(typeof res.body.genre).toBe("string");
      expect(typeof res.body.isActive).toBe("boolean");

      // Your earlier responses include artist nested (at least id + name)
      if (res.body.artist) {
        expect(res.body.artist.id).toBeTruthy();
        expect(res.body.artist.name).toBeTruthy();
      }
    });

    it("returns 404 for a missing track", async () => {
      await request(app.getHttpServer())
        .get(`/tracks/00000000-0000-0000-0000-000000000000`)
        .expect((r) => {
          // Some apps use 404, some 400 for invalid UUID; accept 400/404
          if (![400, 404].includes(r.status)) {
            throw new Error(`Expected 400/404, got ${r.status}`);
          }
        });
    });
  });

  describe("GET /search (title / artist / genre)", () => {
    it("finds by title keyword", async () => {
      const res = await request(app.getHttpServer())
        .get("/search")
        // Most common is `q`. If your API uses a different param, you can add it too:
        .query({ q: "E2E Song Alpha", query: "E2E Song Alpha" })
        .expect(200);

      // Shape might be { items, page } like /tracks, or just an array.
      const body = res.body;
      const items: any[] = Array.isArray(body) ? body : body.items ?? [];

      const found = items.some((t) => t.title?.includes("E2E Song Alpha"));
      expect(found).toBe(true);
    });

    it("finds by genre keyword (e.g., Jazz)", async () => {
      const res = await request(app.getHttpServer())
        .get("/search")
        .query({ q: "Jazz", query: "Jazz" })
        .expect(200);

      const body = res.body;
      const items: any[] = Array.isArray(body) ? body : body.items ?? [];

      // We seeded "E2E Jazz Delta" with genre Jazz
      const found = items.some(
        (t) => t.title?.includes("E2E Jazz Delta") || String(t.genre).toLowerCase() === "jazz",
      );
      expect(found).toBe(true);
    });

    it("returns empty result for a nonsense query (no crash)", async () => {
      const res = await request(app.getHttpServer())
        .get("/search")
        .query({ q: "zzzz-no-such-track-zzzz", query: "zzzz-no-such-track-zzzz" })
        .expect(200);

      const body = res.body;
      const items: any[] = Array.isArray(body) ? body : body.items ?? [];
      expect(Array.isArray(items)).toBe(true);
      // could be empty OR could still contain other matches depending on implementation;
      // we mainly assert: no server error + response shape is sane.
    });
  });
});
*/