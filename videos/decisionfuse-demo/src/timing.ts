export const FPS = 30;

// Every scene and animation time in this project is written in seconds on the
// final video's timeline. sec() converts to frames.
export const sec = (s: number) => Math.round(s * FPS);

// Frames of overlap where one scene dissolves into the next.
export const OVERLAP = 14;
