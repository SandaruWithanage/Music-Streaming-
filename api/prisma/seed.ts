import { PrismaClient } from "@prisma/client";
import { statSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function fileSize(relativePath: string) {
  const fullPath = join(__dirname, "..", "storage", relativePath);
  return BigInt(statSync(fullPath).size);
}

async function main() {
  // =========================
  // 1️⃣ Artist (find or create)
  // =========================
  let artist = await prisma.artist.findFirst({
    where: { name: "Demo Artist" },
  });

  if (!artist) {
    artist = await prisma.artist.create({
      data: { name: "Demo Artist" },
    });
  }

  // =========================
  // 2️⃣ Album
  // =========================
  let album = await prisma.album.findFirst({
    where: {
      title: "Demo Album",
      artistId: artist.id,
    },
  });

  if (!album) {
    album = await prisma.album.create({
      data: {
        title: "Demo Album",
        artistId: artist.id,
        coverUrl: "https://example.com/cover.jpg",
      },
    });
  }

  // =========================
  // 3️⃣ Audio Assets
  // =========================
  const audioFiles = [
    "audio/song1.mp3",
    "audio/song2.mp3",
    "audio/song3.mp3",
  ];

  const audioAssets: { id: string }[] = [];

  for (const key of audioFiles) {
    let asset = await prisma.audioAsset.findUnique({
      where: { storageKey: key },
    });

    if (!asset) {
      asset = await prisma.audioAsset.create({
        data: {
          storageKey: key,
          mimeType: "audio/mpeg",
          sizeBytes: fileSize(key),
        },
      });
    }

    audioAssets.push({ id: asset.id });
  }

  // =========================
  // 4️⃣ Tracks
  // =========================
  const tracks = [
    { title: "Song 1", durationSeconds: 180, genre: "Pop", asset: 0 },
    { title: "Song 2", durationSeconds: 210, genre: "Pop", asset: 1 },
    { title: "Song 3", durationSeconds: 185, genre: "classic", asset: 2 },
  ];

  for (const t of tracks) {
    const existing = await prisma.track.findFirst({
      where: {
        title: t.title,
        artistId: artist.id,
      },
    });

    if (!existing) {
      await prisma.track.create({
        data: {
          title: t.title,
          durationSeconds: t.durationSeconds,
          genre: t.genre,
          tags: [],
          isActive: true,
          artistId: artist.id,
          albumId: album.id,
          audioAssetId: audioAssets[t.asset].id,
        },
      });
    }
  }

  console.log("✅ Catalog seed completed");
}

main()
  .catch(err => {
    console.error("❌ Seed failed", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
