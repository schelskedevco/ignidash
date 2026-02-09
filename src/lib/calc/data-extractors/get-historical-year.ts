/**
 * Maps a simulation year index to the corresponding historical calendar year
 *
 * Used by table/chart extractors to display which historical year's data
 * was used at each point in a historical backtest simulation.
 */

type HistoricalRange = { startYear: number; endYear: number };

/**
 * Resolves which historical calendar year corresponds to a given simulation year
 * @param historicalRanges - Ordered list of historical year ranges used in the simulation
 * @param yearsSinceStart - Zero-based year index into the simulation
 * @returns The historical calendar year, or null if no historical data was used
 */
export function getHistoricalYear(historicalRanges: HistoricalRange[] | null, yearsSinceStart: number): number | null {
  if (!historicalRanges?.length) return null;

  let offset = 0;

  for (const range of historicalRanges) {
    const rangeLength = range.endYear - range.startYear + 1;

    if (yearsSinceStart < offset + rangeLength) {
      return range.startYear + (yearsSinceStart - offset);
    }

    offset += rangeLength;
  }

  // If yearsSinceStart exceeds all ranges, return the last year
  return historicalRanges[historicalRanges.length - 1].endYear;
}
