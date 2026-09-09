// Monument Valley inspired Sound Engine: Tactile pentatonic music-box chimes,
// warm rotatable tumbler clicks, and subtle meditative harmonic pads.
// Synthesized purely with standard Web Audio API (zero external CDN audio assets).

class MonumentSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  // Pentatonic scale frequencies in Hz (F# major / Eb minor meditative scale typical of Monument Valley)
  // Low to high notes: F#3, G#3, A#3, C#4, D#4, F#4, G#4, A#4, C#5, D#5
  private pentatonicNotes: number[] = [
    185.0, 207.65, 233.08, 277.18, 311.13, 369.99, 415.3, 466.16, 554.37, 622.25, 739.99
  ];
  private lastNoteIndex: number = 2;
  
  private hasInteracted: boolean = false;
  private bgAudio: HTMLAudioElement | null = null;
  private currentRealm: string = 'sand';
  private loadedTrack: string = '';
  private audioMap: Record<string, string> = {
    'rose': '/bg-music/Rose_Realm_The-Spire.mp3',
    'sand': '/bg-music/Sand_Realm_The-Descent.mp3',
    'teal': '/bg-music/Teal_Realm_Hidden-Temple.mp3',
    'twilight': '/bg-music/Twilight_Realm_The-Labyrinth.mp3',
  };

  constructor() {
    this.setupAutoplayListeners();
  }

  private setupAutoplayListeners() {
    if (typeof window === 'undefined') return;
    const enableAudio = () => {
      if (!this.hasInteracted) {
        this.hasInteracted = true;
        this.init();
        if (!this.isMuted) {
          this.startAmbiance();
        }
      }
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('touchstart', enableAudio);
    window.addEventListener('keydown', enableAudio);
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbiance();
    } else if (this.hasInteracted) {
      this.startAmbiance();
    }
  }

  public setRealm(realm: string) {
    if (this.currentRealm === realm) return;
    this.currentRealm = realm;
    
    // Aggressively update the audio track if we've interacted
    if (this.hasInteracted && !this.isMuted) {
      this.startAmbiance();
    } else if (this.bgAudio) {
      // Just load it in the background so it's ready
      const trackPath = this.audioMap[this.currentRealm] || this.audioMap['sand'];
      if (this.loadedTrack !== trackPath) {
        this.bgAudio.src = trackPath;
        this.bgAudio.load();
        this.loadedTrack = trackPath;
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play a soft kalimba / music box bell tone
  public playChime(pitchStep: number = 0, volume: number = 0.12) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Wrap pitch into the pentatonic scale
      const index = Math.abs(pitchStep) % this.pentatonicNotes.length;
      const freq = this.pentatonicNotes[index];

      // Bell sound: sine wave + faint harmonic sine
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.01, now); // subtle crystalline harmonic

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.2);

      // Fast percussive strike, gentle glassy decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.6);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 1.65);
      osc2.stop(now + 1.65);
    } catch {
      // Ignore audio failure if restricted by browser
    }
  }

  // Next note in ascending/cyclic harmony
  public playNextMelodicChime(volume: number = 0.1) {
    this.lastNoteIndex = (this.lastNoteIndex + 1) % this.pentatonicNotes.length;
    this.playChime(this.lastNoteIndex, volume);
  }

  // Tactile gear / stone tumbler click when rotating or toggling isometric architecture
  public playStoneClick(pitch: number = 1.0, volume: number = 0.08) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.045);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 * pitch, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      // Ignore
    }
  }

  // Satisfying architectural alignment chord (when completing action or selecting monument)
  public playHarmonicResolve() {
    if (this.isMuted) return;
    try {
      // Play triad chord staggered by 60ms
      const chord = [3, 5, 7];
      chord.forEach((step, i) => {
        setTimeout(() => {
          this.playChime(step, 0.09 - i * 0.015);
        }, i * 70);
      });
    } catch {
      // Ignore
    }
  }

  // Continuous background ambient loop using MP3 files
  public startAmbiance() {
    if (this.isMuted || typeof window === 'undefined') return;
    
    const trackPath = this.audioMap[this.currentRealm] || this.audioMap['sand'];
    
    if (!this.bgAudio) {
      this.bgAudio = new Audio(trackPath);
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.4; // Soft background volume
      this.loadedTrack = trackPath;
    } else if (this.loadedTrack !== trackPath) {
      this.bgAudio.pause();
      this.bgAudio.src = trackPath;
      this.bgAudio.load();
      this.loadedTrack = trackPath;
    }
    
    // Always attempt to play
    const playPromise = this.bgAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Ignore autoplay block
      });
    }
  }

  public stopAmbiance() {
    if (this.bgAudio) {
      this.bgAudio.pause();
    }
  }
}

export const monumentSound = new MonumentSoundEngine();
