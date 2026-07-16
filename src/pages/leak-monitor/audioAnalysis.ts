import type { AudioAnalysisData } from "./types";

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor {
  const browserWindow = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  const Context = browserWindow.AudioContext || browserWindow.webkitAudioContext;
  if (!Context) {
    throw new Error("当前浏览器不支持音频解析");
  }
  return Context;
}

function downsampleWaveform(samples: Float32Array, pointCount = 480) {
  if (!samples.length) return [];
  const bucketSize = Math.max(1, Math.floor(samples.length / pointCount));
  const values: number[] = [];

  for (let offset = 0; offset < samples.length; offset += bucketSize) {
    const end = Math.min(samples.length, offset + bucketSize);
    let peak = 0;
    for (let index = offset; index < end; index += 1) {
      if (Math.abs(samples[index]) > Math.abs(peak)) peak = samples[index];
    }
    values.push(Number(peak.toFixed(4)));
    if (values.length >= pointCount) break;
  }
  return values;
}

function calculateSpectrum(
  samples: Float32Array,
  start: number,
  fftSize = 512,
  binCount = 128,
) {
  const safeSize = Math.min(fftSize, Math.max(0, samples.length - start));
  if (!safeSize) return Array.from({ length: binCount }, () => 0);

  const magnitudes: number[] = [];
  for (let bin = 0; bin < binCount; bin += 1) {
    let real = 0;
    let imaginary = 0;
    for (let index = 0; index < safeSize; index += 1) {
      const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * index) / Math.max(1, safeSize - 1)));
      const sample = samples[start + index] * windowValue;
      const angle = (2 * Math.PI * bin * index) / safeSize;
      real += sample * Math.cos(angle);
      imaginary -= sample * Math.sin(angle);
    }
    const magnitude = Math.sqrt(real * real + imaginary * imaginary) / safeSize;
    magnitudes.push(20 * Math.log10(magnitude + 1e-8));
  }

  const max = Math.max(...magnitudes);
  const floor = max - 70;
  return magnitudes.map((value) => Number((Math.max(0, Math.min(1, (value - floor) / 70)) * 100).toFixed(2)));
}

function calculateSpectrogram(samples: Float32Array) {
  const windowCount = 30;
  const fftSize = 256;
  const maxStart = Math.max(0, samples.length - fftSize);
  return Array.from({ length: windowCount }, (_, index) => {
    const start = Math.floor((maxStart * index) / Math.max(1, windowCount - 1));
    return calculateSpectrum(samples, start, fftSize, 64);
  });
}

export async function analyzeWavArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioAnalysisData> {
  const Context = getAudioContextConstructor();
  const context = new Context();

  try {
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    const samples = audioBuffer.getChannelData(0);
    const spectrumStart = Math.max(0, Math.floor(samples.length / 2) - 256);

    return {
      duration: Number(audioBuffer.duration.toFixed(2)),
      sampleRate: audioBuffer.sampleRate,
      waveform: downsampleWaveform(samples),
      spectrum: calculateSpectrum(samples, spectrumStart, 512, 128),
      spectrogram: calculateSpectrogram(samples),
    };
  } finally {
    void context.close();
  }
}