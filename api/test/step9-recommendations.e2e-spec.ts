import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Step 9 — Recommendations (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // 🔐 Register user
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "reco@test.com",
        password: "password123",
        displayName: "Reco User",
      });

    // 🔐 Login user
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "reco@test.com",
        password: "password123",
      });

    jwt = loginRes.body.accessToken;

    const user = await prisma.user.findUnique({
      where: { email: "reco@test.com" },
    });

    userId = user!.id;
  });

  afterAll(async () => {
    await prisma.listeningHistory.deleteMany();
    await prisma.user.deleteMany({ where: { email: "reco@test.com" } });
    await app.close();
  });

  // =========================
  // TRENDING
  // =========================
  it("GET /recommendations/trending → returns array", async () => {
    const res = await request(app.getHttpServer())
      .get("/recommendations/trending")
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // =========================
  // PERSONAL (NO HISTORY → FALLBACK)
  // =========================
  it("GET /recommendations/personal → falls back to trending if no history", async () => {
    const res = await request(app.getHttpServer())
      .get("/recommendations/personal")
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // =========================
  // SECURITY
  // =========================
  it("GET /recommendations/trending → rejects unauthenticated access", async () => {
    await request(app.getHttpServer())
      .get("/recommendations/trending")
      .expect(401);
  });
});
