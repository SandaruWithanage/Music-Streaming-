import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

describe("Step 1 — Prisma Schema v1 + Migrations (Prisma Client only)", () => {
  const prisma = new PrismaClient();

  // Track IDs created in tests so cleanup is safe and deterministic
  const createdIds = {
    userA: "",
    userB: "",
    artist: "",
    album: "",
    audioAsset: "",
    track: "",
    playlist: "",
    playlistItem1: "",
    playlistItem2: "",
    history: "",
    like: "",
    share: "",
    collaborator: "",
  };

  async function expectUniqueViolation(promise: Promise<any>) {
    try {
      await promise;
      throw new Error("Expected unique constraint violation, but operation succeeded.");
    } catch (e: any) {
      // Prisma unique constraint error
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        expect(e.code).toBe("P2002");
        return;
      }
      // If it’s not PrismaKnownRequestError, fail loudly
      throw e;
    }
  }

  afterAll(async () => {
    // Cleanup order matters because of FK constraints (Restrict/Cascade)
    // Safer to delete leaf tables first.
    await prisma.playlistItem.deleteMany();
    await prisma.playlistShare.deleteMany();
    await prisma.playlistCollaborator.deleteMany();

    await prisma.listeningHistory.deleteMany();
    await prisma.like.deleteMany();

    await prisma.playlist.deleteMany();
    await prisma.track.deleteMany();
    await prisma.audioAsset.deleteMany();
    await prisma.album.deleteMany();
    await prisma.artist.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$disconnect();
  });

  it("creates and reads a full sample graph (User → Playlist → Items → Track → Asset/Artist/Album)", async () => {
    // 1) Users
    const userAEmail = `userA_${randomUUID()}@test.com`;
    const userBEmail = `userB_${randomUUID()}@test.com`;

    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash: "hash",
        displayName: "User A",
        role: "USER",
        preferences: { theme: "dark" },
      },
    });
    createdIds.userA = userA.id;

    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash: "hash",
        displayName: "User B",
        role: "USER",
      },
    });
    createdIds.userB = userB.id;

    // 2) Artist + Album
    const artist = await prisma.artist.create({
      data: { name: `Artist_${randomUUID()}` },
    });
    createdIds.artist = artist.id;

    const album = await prisma.album.create({
      data: {
        title: `Album_${randomUUID()}`,
        coverUrl: "https://example.com/cover.jpg",
        artistId: artist.id,
      },
    });
    createdIds.album = album.id;

    // 3) AudioAsset
    const storageKey = `song_${randomUUID()}.mp3`;
    const audioAsset = await prisma.audioAsset.create({
      data: {
        storageKey,
        mimeType: "audio/mpeg",
        sizeBytes: BigInt(123456),
        checksum: null,
      },
    });
    createdIds.audioAsset = audioAsset.id;

    // 4) Track
    const track = await prisma.track.create({
      data: {
        title: `Track_${randomUUID()}`,
        durationSeconds: 180,
        genre: "Pop",
        tags: [],
        isActive: true,
        artistId: artist.id,
        albumId: album.id,
        audioAssetId: audioAsset.id,
      },
    });
    createdIds.track = track.id;

    // 5) Playlist
    const playlist = await prisma.playlist.create({
      data: {
        name: `Playlist_${randomUUID()}`,
        isPublic: false,
        ownerId: userA.id,
      },
    });
    createdIds.playlist = playlist.id;

    // 6) Playlist items (2 items for ordering proof)
    const item1 = await prisma.playlistItem.create({
      data: {
        playlistId: playlist.id,
        trackId: track.id,
        position: 0,
      },
    });
    createdIds.playlistItem1 = item1.id;

    // Create a second track so we can add another item cleanly
    const audioAsset2 = await prisma.audioAsset.create({
      data: {
        storageKey: `song_${randomUUID()}.mp3`,
        mimeType: "audio/mpeg",
        sizeBytes: BigInt(999),
      },
    });
    const track2 = await prisma.track.create({
      data: {
        title: `Track2_${randomUUID()}`,
        durationSeconds: 200,
        genre: "Pop",
        tags: [],
        artistId: artist.id,
        albumId: album.id,
        audioAssetId: audioAsset2.id,
      },
    });

    const item2 = await prisma.playlistItem.create({
      data: {
        playlistId: playlist.id,
        trackId: track2.id,
        position: 1,
      },
    });
    createdIds.playlistItem2 = item2.id;

    // 7) ListeningHistory (unique userId+trackId)
    const history = await prisma.listeningHistory.create({
      data: {
        userId: userA.id,
        trackId: track.id,
        lastPositionMs: 1000,
        playCount: 1,
        completedCount: 0,
        lastPlayedAt: new Date(),
      },
    });
    createdIds.history = history.id;

    // 8) Like (unique userId+trackId)
    const like = await prisma.like.create({
      data: {
        userId: userA.id,
        trackId: track.id,
      },
    });
    createdIds.like = like.id;

    // 9) PlaylistShare (token unique)
    const share = await prisma.playlistShare.create({
      data: {
        playlistId: playlist.id,
        token: randomUUID().replace(/-/g, ""),
        accessLevel: "VIEW",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    createdIds.share = share.id;

    // 10) PlaylistCollaborator (unique playlistId+userId)
    const collaborator = await prisma.playlistCollaborator.create({
      data: {
        playlistId: playlist.id,
        userId: userB.id,
        permission: "EDIT",
      },
    });
    createdIds.collaborator = collaborator.id;

    // ✅ Read back the playlist with includes (proves relations exist)
    const loaded = await prisma.playlist.findUnique({
      where: { id: playlist.id },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        items: {
          orderBy: { position: "asc" },
          include: {
            track: {
              include: {
                artist: true,
                album: true,
                audioAsset: true,
              },
            },
          },
        },
        collaborators: true,
        shares: true,
      },
    });

    expect(loaded).not.toBeNull();
    expect(loaded?.owner.id).toBe(userA.id);
    expect(loaded?.items.length).toBe(2);
    expect(loaded?.items[0].position).toBe(0);
    expect(loaded?.items[1].position).toBe(1);
    expect(loaded?.items[0].track.audioAsset.storageKey).toContain(".mp3");
    expect(loaded?.collaborators.length).toBe(1);
    expect(loaded?.shares.length).toBe(1);

    // Cleanup the extra records created inside this test (track2 + asset2)
    await prisma.playlistItem.delete({ where: { id: item2.id } });
    await prisma.track.delete({ where: { id: track2.id } });
    await prisma.audioAsset.delete({ where: { id: audioAsset2.id } });
  });

  it("enforces key unique constraints (P2002)", async () => {
    // USER.email unique
    const email = `unique_${randomUUID()}@test.com`;
    await prisma.user.create({
      data: {
        email,
        passwordHash: "hash",
        displayName: "Unique Test",
      },
    });

    await expectUniqueViolation(
      prisma.user.create({
        data: {
          email, // same email again
          passwordHash: "hash",
          displayName: "Duplicate Email",
        },
      })
    );

    // AudioAsset.storageKey unique
    const key = `dup_${randomUUID()}.mp3`;
    await prisma.audioAsset.create({
      data: { storageKey: key, mimeType: "audio/mpeg", sizeBytes: BigInt(1) },
    });

    await expectUniqueViolation(
      prisma.audioAsset.create({
        data: { storageKey: key, mimeType: "audio/mpeg", sizeBytes: BigInt(2) },
      })
    );

    // ListeningHistory unique userId+trackId
    // Need a user + track to test quickly
    const u = await prisma.user.create({
      data: {
        email: `lh_${randomUUID()}@test.com`,
        passwordHash: "hash",
        displayName: "LH User",
      },
    });

    const a = await prisma.artist.create({ data: { name: `LHArtist_${randomUUID()}` } });
    const asset = await prisma.audioAsset.create({
      data: { storageKey: `lh_${randomUUID()}.mp3`, mimeType: "audio/mpeg", sizeBytes: BigInt(10) },
    });

    const t = await prisma.track.create({
      data: {
        title: `LHTrack_${randomUUID()}`,
        durationSeconds: 111,
        genre: "Pop",
        artistId: a.id,
        audioAssetId: asset.id,
      },
    });

    await prisma.listeningHistory.create({
      data: {
        userId: u.id,
        trackId: t.id,
        lastPositionMs: 0,
        playCount: 1,
        completedCount: 0,
        lastPlayedAt: new Date(),
      },
    });

    await expectUniqueViolation(
      prisma.listeningHistory.create({
        data: {
          userId: u.id,
          trackId: t.id, // same pair again
          lastPositionMs: 5,
          playCount: 2,
          completedCount: 0,
          lastPlayedAt: new Date(),
        },
      })
    );

    // Like unique userId+trackId
    await prisma.like.create({ data: { userId: u.id, trackId: t.id } });

    await expectUniqueViolation(
      prisma.like.create({ data: { userId: u.id, trackId: t.id } })
    );

    // Cleanup local records from this test block
    await prisma.like.deleteMany({ where: { userId: u.id } });
    await prisma.listeningHistory.deleteMany({ where: { userId: u.id } });
    await prisma.track.delete({ where: { id: t.id } });
    await prisma.audioAsset.delete({ where: { id: asset.id } });
    await prisma.artist.delete({ where: { id: a.id } });
    await prisma.user.delete({ where: { id: u.id } });
  });
});
