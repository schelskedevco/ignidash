import { SingleSimulationCategory } from '@/lib/types/single-simulation-category';
import { type SingleSimulationTableRow, validateSingleSimulationTableData } from '@/lib/schemas/single-simulation-table-schema';

import type { SimulationResult } from './simulation-engine';

export class TableDataExtractor {
  extractSingleSimulationData(simulation: SimulationResult, category: SingleSimulationCategory): SingleSimulationTableRow[] {
    return validateSingleSimulationTableData([]);
  }
}
