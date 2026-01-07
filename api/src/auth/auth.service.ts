import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1) email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Email already exists");

    // 2) password hashing
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3) create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        role: "USER",
      },
      select: { id: true, email: true, displayName: true, role: true },
    });

    // 4) JWT issuance
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });

    return { accessToken, user };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });

    return {
      accessToken,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
    };
  }

  async logout() {
    // Stateless logout: frontend deletes token
    return { success: true };
  }
}
