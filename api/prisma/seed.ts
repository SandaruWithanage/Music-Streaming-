import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Artists
  const artist1 = await prisma.artist.create({
    data: { name: "Demo Artist" },
  });

  // 2️⃣ Album
  const album1 = await prisma.album.create({
    data: {
      title: "Demo Album",
      artistId: artist1.id,
      coverUrl: "https://example.com/cover.jpg",
    },
  });

  // 3️⃣ Audio assets
  const audio1 = await prisma.audioAsset.create({
    data: {
      storageKey: "demo-track-1.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: BigInt(3000000),
    },
  });

  const audio2 = await prisma.audioAsset.create({
    data: {
      storageKey: "demo-track-2.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: BigInt(3200000),
    },
  });

  // 4️⃣ Tracks
  await prisma.track.createMany({
    data: [
      {
        title: "Demo Track One",
        durationSeconds: 210,
        genre: "Pop",
        isActive: true, 
        artistId: artist1.id,
        albumId: album1.id,
        audioAssetId: audio1.id,
      },
      {
        title: "Demo Track Two",
        durationSeconds: 180,
        genre: "Pop",
        isActive: true, 
        artistId: artist1.id,
        albumId: album1.id,
        audioAssetId: audio2.id,
      },
    ],
  });

  console.log("✅ Catalog seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
