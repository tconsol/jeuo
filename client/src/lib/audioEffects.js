/**
 * Audio Effects for Cricket Commentary
 * Uses Web Audio API for real-time text-to-speech-like effects
 */

import dragonThudUrl from '../assets/dragon-studio-thud-sound-effect-405470.mp3';

const DISMISSAL_LABELS = {
  bowled: 'Bowled!',
  caught: 'Caught out!',
  lbw: 'LBW!',
  stumped: 'Stumped!',
  run_out: 'Run out!',
  hit_wicket: 'Hit wicket!',
  wicket_default: 'Wicket!',
};

let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a tone sequence for cricket events
 * @param {number[]} frequencies - Array of frequencies in Hz
 * @param {number} duration - Duration of each tone in ms
 */
export const playToneSequence = (frequencies, duration = 150) => {
  try {
    const ctx = getAudioContext();
    frequencies.forEach((freq, index) => {
      const startTime = ctx.currentTime + (index * duration) / 1000;
      const endTime = startTime + (duration - 20) / 1000;

      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      oscillator.connect(envelope);
      envelope.connect(ctx.destination);

      envelope.gain.setValueAtTime(0.3, startTime);
      envelope.gain.exponentialRampToValueAtTime(0.01, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
};

/**
 * Speak text using Web Speech API
 * @param {string} text - Text to speak
 * @param {number} rate - Speech rate (0.5-2)
 * @param {number} pitch - Speech pitch (0.1-2)
 */
export const speak = (text, rate = 1, pitch = 1) => {
  try {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 0.8;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
  }
};

/**
 * Play boundary announcement (4)
 */
export const playBoundarySound = () => {
  playToneSequence([523, 587, 659, 783], 200);
  speak('Four!', 1.2, 1);
};

/**
 * Play six announcement
 */
export const playSixSound = () => {
  playToneSequence([659, 783, 880, 987], 200);
  speak('Six! Maximum!', 1.2, 1.1);
};

/**
 * Play wicket announcement using dragon thud sound + speech
 * @param {string} dismissalType - Type of dismissal
 */
export const playWicketSound = (dismissalType = 'wicket_default') => {
  try {
    const audio = new Audio(dragonThudUrl);
    audio.volume = 0.9;
    audio.play().catch(() => {});
  } catch (err) {
    console.warn('Dragon sound failed:', err);
  }
  const label = DISMISSAL_LABELS[dismissalType] || DISMISSAL_LABELS.wicket_default;
  speak(label, 1.1, 0.8);
};

/**
 * Preload all announcement sounds
 */
export const preloadSounds = () => {
  // Initialize audio context
  getAudioContext();

  // Warm up speech synthesis
  if ('speechSynthesis' in window) {
    const warmupUtterance = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(warmupUtterance);
    window.speechSynthesis.cancel();
  }
};

// Preload sounds on module load
if (typeof window !== 'undefined') {
  preloadSounds();
}
