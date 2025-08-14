import type { PhaseType } from '@/lib/calc/simulation-phase';
import type { ReturnsWithMetadata } from '@/lib/calc/returns-provider';
import type { WithdrawalsWithMetadata } from '@/lib/calc/withdrawal-strategy';
import type { Asset } from '@/lib/calc/asset';
import type { HistoricalRangeInfo } from '@/lib/calc/simulation-engine';

export interface PortfolioDTO {
  assets: Asset[];
  contributions: number;
  withdrawals: number;
}

export interface SimulationResultDTO {
  success: boolean;
  bankruptcyAge: number | null;
  data: Array<[number, PortfolioDTO]>;
  phasesMetadata: Array<[number, PhaseType]>;
  returnsMetadata: Array<[number, ReturnsWithMetadata]>;
  cashFlowsMetadata: Array<[number, Array<{ name: string; amount: number }>]>;
  withdrawalsMetadata: Array<[number, WithdrawalsWithMetadata]>;
}

export interface MultiSimulationResultDTO {
  simulations: Array<[number, SimulationResultDTO | (SimulationResultDTO & HistoricalRangeInfo)]>;
}
