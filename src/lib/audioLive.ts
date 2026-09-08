/**
 * Audio processing utilities for Gemini Live API (gemini-3.1-flash-live-preview)
 * Input: 16kHz linear 16-bit PCM little-endian
 * Output: 24kHz linear 16-bit PCM little-endian playback
 */

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // true = little-endian
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToAudioBuffer(base64: string, ctx: AudioContext): AudioBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
  audioBuffer.copyToChannel(float32Array, 0);
  return audioBuffer;
}

export class GaplessAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isMuted = false;

  constructor() {
    // AudioContext will be lazily initialized on user gesture
  }

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async resume(): Promise<void> {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (e) {
      console.warn('Could not resume audio context:', e);
    }
  }

  public playChunk(base64Pcm24k: string) {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      const buffer = base64ToAudioBuffer(base64Pcm24k, ctx);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  public stopAndClear() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    this.activeSources = [];
    if (this.ctx) {
      this.nextStartTime = this.ctx.currentTime;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAndClear();
    }
  }

  public close() {
    this.stopAndClear();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
