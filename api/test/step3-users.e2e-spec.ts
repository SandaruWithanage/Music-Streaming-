/*// test/step3-users.e2e-spec.ts
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Step 3 — Users Module (Profile + Preferences) [e2e]", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Helpers
  const uniqueEmail = (prefix: string) =>
    `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@test.local`;

  async function registerAndLogin(email: string, password: string, displayName: string) {
    // Register
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, displayName })
      .expect((res) => {
        // register can be 201/200 depending on your controller
        if (![200, 201].includes(res.status)) {
          throw new Error(`Unexpected register status: ${res.status}`);
        }
      });

    // Login
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    // Your auth module may return token as "accessToken" or "token"
    const token = loginRes.body?.accessToken ?? loginRes.body?.token;
    if (!token) {
      throw new Error(`Login did not return accessToken/token. Body: ${JSON.stringify(loginRes.body)}`);
    }

    return token as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Mirror your main.ts behavior so DTO validation behaves the same in tests.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /users/me", () => {
    it("rejects unauthenticated access (401)", async () => {
      await request(app.getHttpServer()).get("/users/me").expect(401);
    });

    it("returns the authenticated user profile (200)", async () => {
      const email = uniqueEmail("userme");
      const password = "password123";
      const displayName = "User Me";

      const token = await registerAndLogin(email, password, displayName);

      const res = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Minimal, stable assertions (don’t overfit response shape)
      expect(res.body).toBeTruthy();
      expect(res.body.email).toBe(email);
      expect(res.body.displayName).toBe(displayName);
      expect(res.body.id).toBeTruthy();
    });
  });

  describe("PATCH /users/me/preferences", () => {
    it("rejects unauthenticated updates (401)", async () => {
      await request(app.getHttpServer()).patch("/users/me/preferences").send({ preferences: {} }).expect(401);
    });

    it("updates preferences and persists across sessions", async () => {
      const email = uniqueEmail("prefs");
      const password = "password123";
      const displayName = "Prefs User";

      const token = await registerAndLogin(email, password, displayName);

      const newPreferences = {
        theme: "dark",
        genres: ["Pop", "Classic"],
        autoplay: true,
        volume: 0.7,
      };

      // Update
      await request(app.getHttpServer())
        .patch("/users/me/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({ preferences: newPreferences })
        .expect(200);

      // Read back immediately
      const me1 = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(me1.body.preferences).toEqual(newPreferences);

      // "Across sessions" = new login token, still same stored prefs
      const token2 = await registerAndLogin(uniqueEmail("dummy"), password, "Dummy"); // create another user just to prove nothing breaks
      expect(token2).toBeTruthy();

      // Re-login as the original user
      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password })
        .expect(200);

      const freshToken = loginRes.body?.accessToken ?? loginRes.body?.token;
      expect(freshToken).toBeTruthy();

      const me2 = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${freshToken}`)
        .expect(200);

      expect(me2.body.preferences).toEqual(newPreferences);
    });

    it("enforces ownership implicitly: user A cannot change user B preferences", async () => {
      const password = "password123";

      const emailA = uniqueEmail("ownerA");
      const emailB = uniqueEmail("ownerB");

      const tokenA = await registerAndLogin(emailA, password, "Owner A");
      const tokenB = await registerAndLogin(emailB, password, "Owner B");

      const prefsA = { theme: "dark", genres: ["Pop"] };
      const prefsB = { theme: "light", genres: ["Rock"] };

      // Set B preferences as B
      await request(app.getHttpServer())
        .patch("/users/me/preferences")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ preferences: prefsB })
        .expect(200);

      // Set A preferences as A
      await request(app.getHttpServer())
        .patch("/users/me/preferences")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ preferences: prefsA })
        .expect(200);

      // Verify B still has B prefs (A did not affect B)
      const meB = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(200);

      expect(meB.body.email).toBe(emailB);
      expect(meB.body.preferences).toEqual(prefsB);
    });

    it("rejects unknown fields due to forbidNonWhitelisted (400)", async () => {
      const email = uniqueEmail("whitelist");
      const password = "password123";
      const token = await registerAndLogin(email, password, "Whitelist User");

      // Sending an extra top-level field should be rejected if your DTO is strict
      await request(app.getHttpServer())
        .patch("/users/me/preferences")
        .set("Authorization", `Bearer ${token}`)
        .send({
          preferences: { theme: "dark" },
          hackerField: "nope",
        })
        .expect(400);
    });
  });

  // Optional cleanup: remove only the test users we created (safe even with seed data)
  afterEach(async () => {
    // Delete users created under @test.local domain (keeps your seeded/demo users if any)
    await prisma.user.deleteMany({
      where: { email: { endsWith: "@test.local" } },
    });
  });
});
*/