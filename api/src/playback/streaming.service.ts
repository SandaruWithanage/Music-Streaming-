import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { ReadStream } from "fs";

type SignedPayload = {
  trackId: string;
  exp: number; // unix seconds
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

@Injectable()
export class StreamingService {
  private readonly secret: string;
  private readonly ttlSeconds: number;
  private readonly audioDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.secret = process.env.STREAM_SIGNING_SECRET ?? "";
    if (!this.secret) {
      throw new Error("STREAM_SIGNING_SECRET is required");
    }

    this.ttlSeconds = Number(process.env.STREAM_URL_TTL_SECONDS ?? "60");
    this.audioDir = process.env.AUDIO_STORAGE_DIR ?? "";
    if (!this.audioDir) {
      throw new Error("AUDIO_STORAGE_DIR is required");
    }
  }

  // Door A: JWT → signed URL
  async generateSignedUrl(opts: { trackId: string; baseUrl: string }) {
    const track = await this.prisma.track.findUnique({
      where: { id: opts.trackId },
      include: { audioAsset: true },
    });

    if (!track || !track.isActive) throw new NotFoundException("Track not found");

    const expiresAt = Math.floor(Date.now() / 1000) + this.ttlSeconds;

    const payload: SignedPayload = { trackId: track.id, exp: expiresAt };
    const token = this.signPayload(payload);

    return {
      url: `${opts.baseUrl}/media/${track.id}?token=${encodeURIComponent(token)}`,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  }

  // Door B: token → validate
  validateSignedToken(token: string): { trackId: string } {
    const parts = token.split(".");
    if (parts.length !== 2) throw new UnauthorizedException("Invalid token format");

    const [payloadB64, sigB64] = parts;
    const payloadJson = base64UrlDecode(payloadB64);

    let payload: SignedPayload;
    try {
      payload = JSON.parse(payloadJson) as SignedPayload;
    } catch {
      throw new UnauthorizedException("Invalid token payload");
    }

    const expectedSig = this.hmac(payloadB64);
    if (!crypto.timingSafeEqual(Buffer.from(sigB64), Buffer.from(expectedSig))) {
      throw new UnauthorizedException("Bad signature");
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) throw new UnauthorizedException("Token expired");

    return { trackId: payload.trackId };
  }

  // Streaming (supports Range so seek works)
  async getReadableStream(
    trackId: string,
    rangeHeader: string | undefined
  ): Promise<{
    stream: ReadStream;
    statusCode: number;
    headers: Record<string, string>;
  }> {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: { audioAsset: true },
    });
    if (!track || !track.isActive) throw new NotFoundException("Track not found");

    const storageKey = track.audioAsset.storageKey;

    // Prevent ../../ attacks (path traversal)
    const safeKey = storageKey.replace(/\\/g, "/");
    if (safeKey.includes("..") || path.isAbsolute(safeKey)) {
      throw new UnauthorizedException("Invalid storage key");
    }

    const fullPath = path.join(this.audioDir, safeKey);
    if (!fs.existsSync(fullPath)) throw new NotFoundException("Audio file missing");

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;

    const mimeType = track.audioAsset.mimeType || "audio/mpeg";

    // If no Range header: send full file
    if (!rangeHeader) {
      return {
        stream: fs.createReadStream(fullPath),
        statusCode: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        },
      };
    }

    // Parse Range: "bytes=start-end"
    const match = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader);
    if (!match) {
      // If browser sends weird range, ignore and send full
      return {
        stream: fs.createReadStream(fullPath),
        statusCode: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store",
        },
      };
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      throw new UnauthorizedException("Invalid range");
    }

    const chunkSize = end - start + 1;

    return {
      stream: fs.createReadStream(fullPath, { start, end }),
      statusCode: 206,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    };
  }

  private signPayload(payload: SignedPayload): string {
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const sig = this.hmac(payloadB64);
    return `${payloadB64}.${sig}`;
  }

  private hmac(payloadB64: string): string {
    return crypto
      .createHmac("sha256", this.secret)
      .update(payloadB64)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
}
