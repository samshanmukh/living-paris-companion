/** Optional ambient Paris soundscape — off by default, respects reduced motion. */

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let running = false;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function buildLoop(audio: AudioContext, master: GainNode) {
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.connect(master);

  const bufferSize = audio.sampleRate * 2;
  const noise = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.08;

  const src = audio.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  src.connect(filter);

  const hum = audio.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 110;
  const humGain = audio.createGain();
  humGain.gain.value = 0.012;
  hum.connect(humGain);
  humGain.connect(master);

  src.start();
  hum.start();
}

export async function startAmbientSound() {
  const audio = ensureContext();
  if (!audio || running) return;
  await audio.resume();
  gain = audio.createGain();
  gain.gain.value = 0;
  gain.connect(audio.destination);
  buildLoop(audio, gain);
  gain.gain.linearRampToValueAtTime(0.06, audio.currentTime + 2.5);
  running = true;
}

export function stopAmbientSound() {
  if (!ctx || !gain) {
    running = false;
    return;
  }
  const audio = ctx;
  gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.8);
  window.setTimeout(() => {
    try {
      void ctx?.close();
    } catch {}
    ctx = null;
    gain = null;
    running = false;
  }, 900);
}

export function isAmbientRunning() {
  return running;
}
