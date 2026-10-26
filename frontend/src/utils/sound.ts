/**
 * Pure Web Audio API Transaction Sound Synthesizer
 * Produces crisp, pleasant two-tone fintech confirmation chime (A5 880Hz -> A6 1760Hz)
 * Works without external assets or network round-trips.
 */

class SoundSynthesizer {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public isEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('sound_enabled') !== 'false';
  }

  public setEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sound_enabled', enabled ? 'true' : 'false');
  }

  /**
   * Synthesize pleasant two-tone transaction success chime
   * Frequency: 880Hz (A5) -> 1760Hz (A6) with exponential gain decay
   */
  public playSuccessSound(): void {
    if (!this.isEnabled()) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: 1760Hz (A6) octave higher chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.1);
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('[SoundSynthesizer] Audio context play error:', err);
    }
  }
}

export const soundEngine = new SoundSynthesizer();
export const playSuccessSound = () => soundEngine.playSuccessSound();
