export interface MockPressureDevice {
  id: string;
  pressure: number;
  voltage: number;
  phase: number;
}

export interface MockValveOperation {
  id: string;
  valveId: string;
  start: number;
  duration: number;
  targetOpening: number;
}

export interface AppliedValveOperation extends MockValveOperation {
  initialOpening: number;
}

export type PressurePoint = [number, number];
export type OperationError = "required" | "valve" | "number" | "range" | "overlap" | "unchanged";
export const MOCK_DEVICES: MockPressureDevice[] = [
  { id: "WH-DEMO-001", pressure: 0.42, voltage: 3.72, phase: 0 },
  { id: "WH-DEMO-002", pressure: 0.38, voltage: 3.68, phase: 0.8 },
  { id: "WH-DEMO-003", pressure: 0.46, voltage: 3.76, phase: 1.6 },
];
export const MOCK_VALVES = [
  { id: "MV-001", opening: 100 },
  { id: "MV-002", opening: 60 },
  { id: "MV-003", opening: 40 },
];

export function baselineWaveform(device: MockPressureDevice): PressurePoint[] {
  return Array.from({ length: 601 }, (_, index) => {
    const time = index / 10;
    return [time, device.pressure + 0.002 * Math.sin(time * 1.2 + device.phase) + 0.001 * Math.sin(time * 5 + device.phase)];
  });
}

export function validateOperations(operations: MockValveOperation[]): OperationError | null {
  if (!operations.length || operations.length > 6) return "required";
  const openings = new Map(MOCK_VALVES.map((valve) => [valve.id, valve.opening]));
  const endTimes = new Map<string, number>();
  for (const operation of [...operations].sort((a, b) => a.start - b.start)) {
    if (!openings.has(operation.valveId)) return "valve";
    if (![operation.start, operation.duration, operation.targetOpening].every((value) => typeof value === "number" && Number.isFinite(value))) return "number";
    if (operation.start < 1 || operation.duration < 0.2 || operation.duration > 30 || operation.start + operation.duration > 55 || operation.targetOpening < 0 || operation.targetOpening > 100) return "range";
    if (operation.start < (endTimes.get(operation.valveId) ?? 0)) return "overlap";
    if (operation.targetOpening === openings.get(operation.valveId)) return "unchanged";
    openings.set(operation.valveId, operation.targetOpening);
    endTimes.set(operation.valveId, operation.start + operation.duration);
  }
  return null;
}

export function generateMockSimulation(device: MockPressureDevice, operations: MockValveOperation[]) {
  const error = validateOperations(operations);
  if (error) throw new Error(error);
  const openings = new Map(MOCK_VALVES.map((valve) => [valve.id, valve.opening]));
  const applied: AppliedValveOperation[] = [...operations].sort((a, b) => a.start - b.start).map((operation) => {
    const initialOpening = openings.get(operation.valveId)!;
    openings.set(operation.valveId, operation.targetOpening);
    return { ...operation, initialOpening };
  });
  const baseline = baselineWaveform(device);
  // Deterministic display-only perturbations, not a hydraulic solver or measured data.
  const waveform: PressurePoint[] = baseline.map(([time, pressure]) => {
    let disturbance = 0;
    for (const operation of applied) {
      const elapsed = time - operation.start;
      if (elapsed < 0) continue;
      const change = (operation.initialOpening - operation.targetOpening) / 100;
      const amplitude = 0.2 * change / Math.sqrt(operation.duration + 0.5);
      const ramp = Math.min(1, elapsed / operation.duration);
      disturbance += amplitude * ramp * Math.exp(-elapsed / 8) * Math.sin(elapsed * 2.6);
    }
    return [time, pressure + disturbance];
  });
  const pressures = waveform.map((point) => point[1]);
  return {
    deviceId: device.id,
    operations: applied,
    waveform,
    maximum: Math.max(...pressures),
    minimum: Math.min(...pressures),
    maxDeviation: Math.max(...waveform.map((point, index) => Math.abs(point[1] - baseline[index][1]))),
  };
}
