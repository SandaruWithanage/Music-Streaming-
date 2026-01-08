export type TrackDto = {
  id: string;
  title: string;
  durationSeconds: number;
  genre: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;

  artist: { id: string; name: string };
  album?: { id: string; title: string; coverUrl?: string | null } | null;
};
