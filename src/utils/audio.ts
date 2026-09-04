/**
 * Web Audio API synthesizer for interactive party sounds & ambient vibes
 * Works seamlessly in all modern browsers without external audio assets.
 */

let audioCtx: AudioContext | null = null;
let bgMasterGain: GainNode | null = null;
let isBgPlaying = false;
let bgSchedulerTimer: ReturnType<typeof setInterval> | null = null;
let nextNoteTime = 0;
let currentStep = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSoundEffect(type: 'click' | 'select' | 'success' | 'fail' | 'pass' | 'notification' | 'chat' | 'typing' | 'approval') {
  try {
    // Haptic vibration feedback synchronized with sounds on mobile devices (Section 8.2)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'approval') {
        navigator.vibrate([50, 40, 60]);
      } else if (type === 'success') {
        navigator.vibrate([40, 50, 40]);
      } else if (type === 'fail') {
        navigator.vibrate([60, 40]);
      } else if (type === 'notification' || type === 'chat') {
        navigator.vibrate(35);
      } else if (type === 'click' || type === 'select') {
        navigator.vibrate(12);
      } else if (type === 'typing') {
        navigator.vibrate(5);
      }
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'click') {
      // Woodblock / playful tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'typing') {
      // Subtle tactile wooden tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.02);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (type === 'select') {
      // Upbeat cheerful marimba note
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'success') {
      // Cheerful celebratory party fanfare (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + i * 0.06);
        noteGain.gain.setValueAtTime(0.14, now + i * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.start(now + i * 0.06);
        noteOsc.stop(now + i * 0.06 + 0.3);
      });
    } else if (type === 'fail') {
      // Playful comic "boing / wah" bounce (fun & good-natured for party games)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.22);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'approval') {
      // Sparkling festive party chime
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.04);
        g.gain.setValueAtTime(0.12, now + idx * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.04);
        o.stop(now + idx * 0.04 + 0.4);
      });
    } else if (type === 'pass') {
      // Quick playful whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.14);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'notification' || type === 'chat') {
      // Bubbly friendly two-tone
      const notes = [587.33, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    }
  } catch (e) {
    console.debug('Audio not allowed yet by user interaction', e);
  }
}

/**
 * Playful, upbeat ambient Afro-lounge party groove
 * Synthesizes a warm syncopated marimba, bouncing bassline, and subtle conga accents
 * Keeps volume cozy, pleasant, and ambient (~0.05 master)
 */
export function toggleBackgroundMusic(enable: boolean) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!enable && isBgPlaying) {
      if (bgSchedulerTimer) {
        clearInterval(bgSchedulerTimer);
        bgSchedulerTimer = null;
      }
      if (bgMasterGain) {
        bgMasterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      }
      setTimeout(() => {
        if (bgMasterGain) {
          bgMasterGain.disconnect();
          bgMasterGain = null;
        }
        isBgPlaying = false;
      }, 200);
      return;
    }

    if (enable && !isBgPlaying) {
      isBgPlaying = true;
      const now = ctx.currentTime;
      nextNoteTime = now + 0.05;
      currentStep = 0;

      // Master ambient gain
      bgMasterGain = ctx.createGain();
      bgMasterGain.gain.setValueAtTime(0.001, now);
      bgMasterGain.gain.setTargetAtTime(0.065, now, 0.4); // Comfortable, cheerful ambient level
      bgMasterGain.connect(ctx.destination);

      // 16-step repeating festive party sequence (Tempo = 104 BPM, step = 16th note ~0.144s)
      const stepDuration = 60 / 104 / 4; // 16th note in seconds

      // Pentatonic marimba notes (F4, G4, Ab4, Bb4, C5, Eb5, F5)
      const marimbaPattern: Array<number | null> = [
        349.23, null, 440.0, null, // Step 0-3
        523.25, 349.23, null, 659.25, // Step 4-7
        null, 523.25, 440.0, null, // Step 8-11
        349.23, null, 392.0, null, // Step 12-15
      ];

      // Bouncy bassline notes (F2, Ab2, Bb2, C3)
      const bassPattern: Array<number | null> = [
        87.31, null, null, null, // Step 0-3 (F2)
        null, null, 103.83, null, // Step 4-7 (Ab2)
        116.54, null, null, null, // Step 8-11 (Bb2)
        null, 130.81, null, 87.31, // Step 12-15 (C3 -> F2)
      ];

      // Subtle warm conga / shaker tick pattern
      const percPattern: Array<'bongo' | 'shaker' | null> = [
        'bongo', 'shaker', null, 'shaker',
        'bongo', null, 'shaker', null,
        'bongo', 'shaker', null, 'shaker',
        null, 'bongo', 'shaker', null,
      ];

      const scheduleStep = (step: number, time: number) => {
        if (!ctx || !bgMasterGain) return;

        // 1. Play marimba melodic note
        const mFreq = marimbaPattern[step % 16];
        if (mFreq) {
          const mOsc = ctx.createOscillator();
          const mGain = ctx.createGain();
          mOsc.type = 'sine';
          mOsc.frequency.setValueAtTime(mFreq, time);
          mGain.gain.setValueAtTime(0.045, time);
          mGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 1.8);
          mOsc.connect(mGain);
          mGain.connect(bgMasterGain);
          mOsc.start(time);
          mOsc.stop(time + stepDuration * 1.8);
        }

        // 2. Play bass tone
        const bFreq = bassPattern[step % 16];
        if (bFreq) {
          const bOsc = ctx.createOscillator();
          const bGain = ctx.createGain();
          bOsc.type = 'triangle';
          bOsc.frequency.setValueAtTime(bFreq, time);
          bGain.gain.setValueAtTime(0.07, time);
          bGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 2.5);
          bOsc.connect(bGain);
          bGain.connect(bgMasterGain);
          bOsc.start(time);
          bOsc.stop(time + stepDuration * 2.5);
        }

        // 3. Play soft percussion accent (bongo / shaker)
        const perc = percPattern[step % 16];
        if (perc === 'bongo') {
          const pOsc = ctx.createOscillator();
          const pGain = ctx.createGain();
          pOsc.type = 'sine';
          pOsc.frequency.setValueAtTime(220, time);
          pOsc.frequency.exponentialRampToValueAtTime(95, time + 0.08);
          pGain.gain.setValueAtTime(0.04, time);
          pGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
          pOsc.connect(pGain);
          pGain.connect(bgMasterGain);
          pOsc.start(time);
          pOsc.stop(time + 0.08);
        } else if (perc === 'shaker') {
          const sOsc = ctx.createOscillator();
          const sGain = ctx.createGain();
          sOsc.type = 'triangle';
          sOsc.frequency.setValueAtTime(1200, time);
          sGain.gain.setValueAtTime(0.015, time);
          sGain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
          sOsc.connect(sGain);
          sGain.connect(bgMasterGain);
          sOsc.start(time);
          sOsc.stop(time + 0.035);
        }
      };

      // Accurate Web Audio lookahead scheduler (runs every 40ms)
      const scheduler = () => {
        if (!isBgPlaying || !ctx) return;
        while (nextNoteTime < ctx.currentTime + 0.15) {
          scheduleStep(currentStep, nextNoteTime);
          nextNoteTime += stepDuration;
          currentStep = (currentStep + 1) % 16;
        }
      };

      bgSchedulerTimer = setInterval(scheduler, 40);
    }
  } catch (e) {
    console.debug('Ambient music toggle err', e);
  }
}

