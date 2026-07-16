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

function calculateSpectrumDb(
  samples: Float32Array,
  start: number,
  fftSize = 512,
  binCount = 256,
) {
  const safeSize = Math.min(fftSize, Math.max(0, samples.length - start));
  if (!safeSize) return Array.from({ length: binCount }, () => -120);

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

  return magnitudes;
}

function normalizeSpectrum(values: number[], referenceMax = Math.max(...values), dynamicRange = 70) {
  const floor = referenceMax - dynamicRange;
  return values.map((value) =>
    Number((Math.max(0, Math.min(1, (value - floor) / dynamicRange)) * 100).toFixed(2)));
}

function calculateSpectrum(
  samples: Float32Array,
  start: number,
  fftSize = 512,
  binCount = 256,
) {
  return normalizeSpectrum(calculateSpectrumDb(samples, start, fftSize, binCount));
}

function calculateSpectrogram(samples: Float32Array) {
  const windowCount = 72;
  const fftSize = 512;
  const binCount = 128;
  const maxStart = Math.max(0, samples.length - fftSize);
  const frames = Array.from({ length: windowCount }, (_, index) => {
    const start = Math.floor((maxStart * index) / Math.max(1, windowCount - 1));
    return calculateSpectrumDb(samples, start, fftSize, binCount);
  });
  const globalMaximum = Math.max(...frames.flat());
  return frames.map((frame) => normalizeSpectrum(frame, globalMaximum, 72));
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
      spectrum: calculateSpectrum(samples, spectrumStart, 512, 256),
      spectrogram: calculateSpectrogram(samples),
    };
  } finally {
    void context.close();
  }
}
