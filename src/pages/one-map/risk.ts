import type { TubeNetworkRecord } from '@/services/leak-monitor/tube-network';
export type RiskBand = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNASSESSED';
export const RISK_COLORS: Record<RiskBand, string> = { HIGH: '#dc2626', MEDIUM: '#f59e0b', LOW: '#16a34a', UNASSESSED: '#94a3b8' };
export function riskBand(tube: TubeNetworkRecord): RiskBand {
  if (tube.riskScore == null || String(tube.riskScore).trim() === '' || !Number.isFinite(Number(tube.riskScore))) return 'UNASSESSED';
  const level = String(tube.riskLevel || '').toUpperCase();
  return level === 'HIGH' || level === 'MEDIUM' || level === 'LOW' ? level : 'UNASSESSED';
}
export function riskColor(tube: TubeNetworkRecord) {
  // Keep the legend consistent; do not infer a score from material or age in the client.
  return RISK_COLORS[riskBand(tube)];
}
