/**
 * ACA Premium Tax Credit parameters
 *
 * Tax year 2026.
 * Federal Poverty Level (FPL) guidelines for ACA subsidy calculation.
 * Source: HHS 2026 Poverty Guidelines.
 *
 * Benchmark premium: second-lowest-cost Silver plan (SLCSP).
 * This is a user-configurable input defaulting to national average.
 */

export const FPL_2026 = {
  base: 15_650,              // 1-person household
  perPerson: 5_480,          // additional person increment
};

export const DEFAULT_BENCHMARK_PREMIUM = {
  single: 8_400,            // annual benchmark for 1 person
  couple: 16_800,           // annual benchmark for 2 persons
};