/**
 * IRS Uniform Lifetime Table for Required Minimum Distributions (RMDs)
 *
 * Source: IRS Uniform Lifetime Table via Fidelity
 * https://www.fidelity.com/bin-public/060_www_fidelity_com/documents/UniformLifetimeTable.pdf
 *
 * Contents: Life expectancy factors for ages 72-120, used to calculate annual
 * RMD amounts from tax-deferred accounts (RMD = balance / factor).
 *
 * Effective for distribution calendar years beginning on or after January 1, 2022.
 * See IRS Reg. §1.401(a)(9)-9(c) for official regulations.
 *
 * Used by: Portfolio (withdrawal calculations) and withdrawals chart (RMD line overlay)
 */

export interface UniformLifetimeEntry {
  age: number;
  lifeExpectancyFactor: number;
}

export const uniformLifetimeTable: UniformLifetimeEntry[] = [
  { age: 72, lifeExpectancyFactor: 27.4 },
  { age: 73, lifeExpectancyFactor: 26.5 },
  { age: 74, lifeExpectancyFactor: 25.5 },
  { age: 75, lifeExpectancyFactor: 24.6 },
  { age: 76, lifeExpectancyFactor: 23.7 },
  { age: 77, lifeExpectancyFactor: 22.9 },
  { age: 78, lifeExpectancyFactor: 22.0 },
  { age: 79, lifeExpectancyFactor: 21.1 },
  { age: 80, lifeExpectancyFactor: 20.2 },
  { age: 81, lifeExpectancyFactor: 19.4 },
  { age: 82, lifeExpectancyFactor: 18.5 },
  { age: 83, lifeExpectancyFactor: 17.7 },
  { age: 84, lifeExpectancyFactor: 16.8 },
  { age: 85, lifeExpectancyFactor: 16.0 },
  { age: 86, lifeExpectancyFactor: 15.2 },
  { age: 87, lifeExpectancyFactor: 14.4 },
  { age: 88, lifeExpectancyFactor: 13.7 },
  { age: 89, lifeExpectancyFactor: 12.9 },
  { age: 90, lifeExpectancyFactor: 12.2 },
  { age: 91, lifeExpectancyFactor: 11.5 },
  { age: 92, lifeExpectancyFactor: 10.8 },
  { age: 93, lifeExpectancyFactor: 10.1 },
  { age: 94, lifeExpectancyFactor: 9.5 },
  { age: 95, lifeExpectancyFactor: 8.9 },
  { age: 96, lifeExpectancyFactor: 8.4 },
  { age: 97, lifeExpectancyFactor: 7.8 },
  { age: 98, lifeExpectancyFactor: 7.3 },
  { age: 99, lifeExpectancyFactor: 6.8 },
  { age: 100, lifeExpectancyFactor: 6.4 },
  { age: 101, lifeExpectancyFactor: 6.0 },
  { age: 102, lifeExpectancyFactor: 5.6 },
  { age: 103, lifeExpectancyFactor: 5.2 },
  { age: 104, lifeExpectancyFactor: 4.9 },
  { age: 105, lifeExpectancyFactor: 4.6 },
  { age: 106, lifeExpectancyFactor: 4.3 },
  { age: 107, lifeExpectancyFactor: 4.1 },
  { age: 108, lifeExpectancyFactor: 3.9 },
  { age: 109, lifeExpectancyFactor: 3.7 },
  { age: 110, lifeExpectancyFactor: 3.5 },
  { age: 111, lifeExpectancyFactor: 3.4 },
  { age: 112, lifeExpectancyFactor: 3.3 },
  { age: 113, lifeExpectancyFactor: 3.1 },
  { age: 114, lifeExpectancyFactor: 3.0 },
  { age: 115, lifeExpectancyFactor: 2.9 },
  { age: 116, lifeExpectancyFactor: 2.8 },
  { age: 117, lifeExpectancyFactor: 2.7 },
  { age: 118, lifeExpectancyFactor: 2.5 },
  { age: 119, lifeExpectancyFactor: 2.3 },
  { age: 120, lifeExpectancyFactor: 2.0 },
];

/**
 * A lookup map for O(1) access by age.
 */
export const uniformLifetimeMap: Record<number, number> = Object.fromEntries(
  uniformLifetimeTable.map(({ age, lifeExpectancyFactor }) => [age, lifeExpectancyFactor])
);

/**
 * Get the life expectancy factor for a given age.
 * Returns undefined if the age is outside the Uniform Lifetime Table range.
 */
export function getLifeExpectancyFactor(age: number): number | undefined {
  return uniformLifetimeMap[age];
}
