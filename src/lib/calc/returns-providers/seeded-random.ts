/**
 * Seeded random number generator for reproducible simulations
 * Uses a linear congruential generator (LCG) algorithm
 */
export class SeededRandom {
  private seed: number;

  /**
   * Creates a seeded random number generator
   * @param seed - Initial seed value for random number generation
   */
  constructor(seed: number) {
    // Ensure seed is a positive integer within valid range
    this.seed = Math.floor(Math.abs(seed)) % 2147483648; // 2^31
    if (this.seed === 0) this.seed = 1;
  }

  /**
   * Generate next random number in the interval [0, 1)
   * @returns Random number between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    // LCG parameters (same as glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2147483648; // 2^31

    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Generate a random number from standard normal distribution (mean=0, std=1)
   * Uses Box-Muller transform
   * @returns Standard normal random variable (mean=0, std=1)
   */
  nextGaussian(): number {
    let u1;

    // Ensure u1 is not 0 to avoid log(0)
    do {
      u1 = this.next();
    } while (u1 === 0);

    const u2 = this.next();

    // Box-Muller transform
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0;
  }

  /**
   * Generate a random number from the Gamma distribution
   * Uses Marsaglia-Tsang method for shape >= 1, with Ahrens-Dieter boost for shape < 1
   * @param shape - Shape parameter (alpha), must be > 0
   * @param scale - Scale parameter (beta), must be > 0
   * @returns Gamma-distributed random variable
   */
  nextGamma(shape: number, scale: number): number {
    if (shape < 1) {
      // Ahrens-Dieter boost: Gamma(shape) = Gamma(shape+1) * U^(1/shape)
      const u = this.next();
      return this.nextGamma(shape + 1, scale) * Math.pow(u, 1 / shape);
    }

    // Marsaglia-Tsang method for shape >= 1
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x: number;
      let v: number;

      do {
        x = this.nextGaussian();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = this.next();

      // Squeeze test (passes ~97% of the time)
      if (u < 1 - 0.0331 * (x * x) * (x * x)) {
        return d * v * scale;
      }

      // Full acceptance test
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Generate a random number from the Chi-squared distribution
   * @param df - Degrees of freedom, must be > 0
   * @returns Chi-squared distributed random variable
   */
  nextChiSquared(df: number): number {
    return this.nextGamma(df / 2, 2);
  }

  /**
   * Reset the generator with a new seed
   * @param seed - New seed value for random number generation
   */
  reset(seed: number): void {
    // Apply same validation as constructor
    this.seed = Math.floor(Math.abs(seed)) % 2147483648; // 2^31
    if (this.seed === 0) this.seed = 1;
  }
}
