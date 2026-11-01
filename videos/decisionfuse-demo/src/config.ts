// Project-level settings. Edit these first when starting a new video.

export const BRAND = {
  // Shown in the top-left header during chapter scenes.
  name: 'DecisionFuse',
  // Optional logo in public/ (e.g. 'logo.png'); null hides it.
  logo: 'logo.png' as string | null,
};

export const AUDIO = {
  // Voiceover played under the video, in public/ (WAV recommended). null = silent.
  voiceover: null as string | null,
  // Mono 16 kHz WAV of the same voiceover, used to drive waveform bars. null = idle bars.
  viz: null as string | null,
};
