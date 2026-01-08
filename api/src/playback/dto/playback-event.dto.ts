export type PlaybackEventType = "START" | "PROGRESS" | "PAUSE" | "END" | "SEEK";

export class PlaybackEventDto {
  trackId!: string;
  type!: PlaybackEventType;

  // milliseconds from start of track
  positionMs?: number;

  // optional: total duration (ms) if you want
  durationMs?: number;

  // optional: client timestamp if you want
  clientTs?: number;
}
