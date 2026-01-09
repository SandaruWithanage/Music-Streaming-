// test/step2-auth.e2e-spec.ts
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { AppModule } from "../src/app.module";

describe("Step 2 — Auth Module (Register/Login/JWT Guards) [e2e]", () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  // We'll create unique test users each run, then delete them
  const email = `e2e_auth_${randomUUID()}@test.com`;
  const password = `P@ssw0rd_${randomUUID()}`;
  const displayName = "E2E Auth User";

  let jwt: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Match your main.ts behavior (strict validation is good for tests)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    // Cleanup test users created by this file
    await prisma.user.deleteMany({
      where: { email: { startsWith: "e2e_auth_" } },
    });

    await prisma.$disconnect();
    await app.close();
  });

  it("POST /auth/register — registers a user (and stores hashed password)", async () => {
    /**
     * NOTE:
     * If your register DTO uses different field names, update this body.
     * Common patterns:
     *  - { email, password, displayName }
     *  - { email, password, name }
     */
    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, displayName })
      .expect((r) => {
        // some projects return 201, some return 200
        if (![200, 201].includes(r.status)) {
          throw new Error(`Expected 200/201, got ${r.status}: ${JSON.stringify(r.body)}`);
        }
      });

    // Minimal sanity checks (don’t over-assume response shape)
    expect(res.body).toBeDefined();

    // Verify password is not stored as plain text (DB-level fact check)
    const dbUser = await prisma.user.findUnique({ where: { email } });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.passwordHash).toBeDefined();
    expect(dbUser!.passwordHash).not.toEqual(password); // ✅ hashed, not raw
  });

  it("POST /auth/register — rejects duplicate email", async () => {
    await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password: password + "_2", displayName })
      .expect((r) => {
        // Different apps return 400 or 409; accept either
        if (![400, 409].includes(r.status)) {
          throw new Error(`Expected 400/409, got ${r.status}: ${JSON.stringify(r.body)}`);
        }
      });
  });

  it("POST /auth/login — returns JWT for valid credentials", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(200);

    // Your API might return { accessToken } or { token } etc.
    const token =
      res.body?.accessToken ??
      res.body?.token ??
      res.body?.jwt ??
      res.body?.access_token;

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    jwt = token;
  });

  it("POST /auth/login — rejects invalid password", async () => {
    await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "wrong-password" })
      .expect((r) => {
        // often 401, sometimes 400 depending on implementation
        if (![400, 401].includes(r.status)) {
          throw new Error(`Expected 400/401, got ${r.status}: ${JSON.stringify(r.body)}`);
        }
      });
  });

  it("JWT Guard — protected route rejects unauthenticated access", async () => {
    // We use /users/me because your app already has it and it's guarded.
    await request(app.getHttpServer())
      .get("/users/me")
      .expect(401);
  });

  it("JWT Guard — protected route allows access with Bearer token", async () => {
    const res = await request(app.getHttpServer())
      .get("/users/me")
      .set("Authorization", `Bearer ${jwt}`)
      .expect(200);

    // Minimal checks
    expect(res.body).toBeDefined();
    // most apps return { id, email, displayName, ... }
    if (res.body?.email) {
      expect(res.body.email).toEqual(email);
    }
  });

  it("POST /auth/logout — works (stateless OK)", async () => {
    // If your logout endpoint requires auth, keep Authorization.
    const res = await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Authorization", `Bearer ${jwt}`)
      .send({})
      .expect((r) => {
        // could be 200/204 depending on your implementation
        if (![200, 204].includes(r.status)) {
          throw new Error(`Expected 200/204, got ${r.status}: ${JSON.stringify(r.body)}`);
        }
      });

    // If 200, body might be { ok: true } or similar — don’t over-assume
    expect(res).toBeDefined();
  });
});
