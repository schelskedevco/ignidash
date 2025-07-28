/**
 * Historical financial market data (1871-present)
 *
 * Real annual returns for stocks and bonds, plus inflation rates.
 * Data source: Ibbotson-Shiller dataset via ie-data.csv
 *
 * Generated automatically - do not edit manually.
 */

export interface HistoricalYearData {
  year: number;
  stockReturn: number; // Real annual stock return (S&P 500 total return)
  bondReturn: number; // Real annual bond return
  inflationRate: number; // Annual inflation rate (CPI-based)
}

export const historicalData: HistoricalYearData[] = [
  { year: 1871, stockReturn: 0.105938, bondReturn: 0.03, inflationRate: 0.015249 },
  { year: 1872, stockReturn: 0.07402, bondReturn: 0.009615, inflationRate: 0.022925 },
  { year: 1873, stockReturn: -0.02287, bondReturn: 0.12381, inflationRate: -0.058733 },
  { year: 1874, stockReturn: 0.118345, bondReturn: 0.162393, inflationRate: -0.069523 },
  { year: 1875, stockReturn: 0.08012, bondReturn: 0.138686, inflationRate: -0.049522 },
  { year: 1876, stockReturn: -0.132716, bondReturn: 0.063291, inflationRate: -0.009217 },
  { year: 1877, stockReturn: 0.129115, bondReturn: 0.204819, inflationRate: -0.130713 },
  { year: 1878, stockReturn: 0.258331, bondReturn: 0.182692, inflationRate: -0.113759 },
  { year: 1879, stockReturn: 0.22293, bondReturn: -0.102459, inflationRate: 0.171498 },
  { year: 1880, stockReturn: 0.250549, bondReturn: 0.116822, inflationRate: -0.048048 },
  { year: 1881, stockReturn: -0.062053, bondReturn: -0.03719, inflationRate: 0.080679 },
  { year: 1882, stockReturn: 0.056458, bondReturn: 0.051282, inflationRate: -0.018664 },
  { year: 1883, stockReturn: 0.049168, bondReturn: 0.121457, inflationRate: -0.076076 },
  { year: 1884, stockReturn: -0.005963, bondReturn: 0.158273, inflationRate: -0.102925 },
  { year: 1885, stockReturn: 0.309085, bondReturn: 0.058824, inflationRate: -0.012077 },
  { year: 1886, stockReturn: 0.155196, bondReturn: 0.045584, inflationRate: -0.02378 },
  { year: 1887, stockReturn: -0.05149, bondReturn: -0.013928, inflationRate: 0.036295 },
  { year: 1888, stockReturn: 0.021126, bondReturn: 0.062678, inflationRate: -0.010753 },
  { year: 1889, stockReturn: 0.080843, bondReturn: 0.059278, inflationRate: -0.02378 },
  { year: 1890, stockReturn: -0.143586, bondReturn: -0.018957, inflationRate: 0.038108 },
  { year: 1891, stockReturn: 0.207525, bondReturn: 0.07381, inflationRate: -0.035897 },
  { year: 1892, stockReturn: -0.000039, bondReturn: -0.015086, inflationRate: 0.038199 },
  { year: 1893, stockReturn: -0.074637, bondReturn: 0.165533, inflationRate: -0.108861 },
  { year: 1894, stockReturn: 0.088849, bondReturn: 0.098113, inflationRate: -0.040876 },
  { year: 1895, stockReturn: 0.028171, bondReturn: -0.008547, inflationRate: 0.028919 },
  { year: 1896, stockReturn: 0.028536, bondReturn: 0.049153, inflationRate: 0.0 },
  { year: 1897, stockReturn: 0.134667, bondReturn: 0.004687, inflationRate: 0.029366 },
  { year: 1898, stockReturn: 0.18177, bondReturn: 0.035659, inflationRate: 0.015015 },
  { year: 1899, stockReturn: -0.127316, bondReturn: -0.123696, inflationRate: 0.168639 },
  { year: 1900, stockReturn: 0.215047, bondReturn: 0.071186, inflationRate: -0.036709 },
  { year: 1901, stockReturn: 0.124164, bondReturn: -0.014377, inflationRate: 0.036316 },
  { year: 1902, stockReturn: -0.052829, bondReturn: -0.059105, inflationRate: 0.083544 },
  { year: 1903, stockReturn: -0.130722, bondReturn: 0.09589, inflationRate: -0.06582 },
  { year: 1904, stockReturn: 0.259879, bondReturn: 0.003195, inflationRate: 0.022947 },
  { year: 1905, stockReturn: 0.169186, bondReturn: 0.036566, inflationRate: 0.0 },
  { year: 1906, stockReturn: -0.022091, bondReturn: -0.039755, inflationRate: 0.05549 },
  { year: 1907, stockReturn: -0.268805, bondReturn: 0.029874, inflationRate: -0.011299 },
  { year: 1908, stockReturn: 0.326185, bondReturn: 0.0, inflationRate: 0.04388 },
  { year: 1909, stockReturn: 0.058986, bondReturn: -0.08321, inflationRate: 0.11745 },
  { year: 1910, stockReturn: 0.007098, bondReturn: 0.1056, inflationRate: -0.067677 },
  { year: 1911, stockReturn: 0.051314, bondReturn: 0.056277, inflationRate: -0.020585 },
  { year: 1912, stockReturn: 0.01307, bondReturn: -0.053645, inflationRate: 0.062432 },
  { year: 1913, stockReturn: -0.107457, bondReturn: 0.041056, inflationRate: 0.020408 },
  { year: 1914, stockReturn: -0.084617, bondReturn: 0.022409, inflationRate: 0.01 },
  { year: 1915, stockReturn: 0.302268, bondReturn: 0.032787, inflationRate: 0.019802 },
  { year: 1916, stockReturn: -0.011219, bondReturn: -0.082337, inflationRate: 0.115385 },
  { year: 1917, stockReturn: -0.348981, bondReturn: -0.13246, inflationRate: 0.17094 },
  { year: 1918, stockReturn: 0.002114, bondReturn: -0.111301, inflationRate: 0.178571 },
  { year: 1919, stockReturn: 0.049779, bondReturn: -0.119002, inflationRate: 0.145455 },
  { year: 1920, stockReturn: -0.185145, bondReturn: 0.033333, inflationRate: 0.005181 },
  { year: 1921, stockReturn: 0.204273, bondReturn: 0.214286, inflationRate: -0.089474 },
  { year: 1922, stockReturn: 0.267798, bondReturn: 0.036851, inflationRate: 0.0 },
  { year: 1923, stockReturn: -0.013328, bondReturn: 0.032051, inflationRate: 0.029762 },
  { year: 1924, stockReturn: 0.215397, bondReturn: 0.052469, inflationRate: 0.0 },
  { year: 1925, stockReturn: 0.193487, bondReturn: 0.014599, inflationRate: 0.034682 },
  { year: 1926, stockReturn: 0.13093, bondReturn: 0.071633, inflationRate: -0.011173 },
  { year: 1927, stockReturn: 0.376826, bondReturn: 0.043364, inflationRate: -0.011429 },
  { year: 1928, stockReturn: 0.386751, bondReturn: 0.022613, inflationRate: -0.011561 },
  { year: 1929, stockReturn: -0.115689, bondReturn: 0.051534, inflationRate: 0.005848 },
  { year: 1930, stockReturn: -0.20741, bondReturn: 0.091224, inflationRate: -0.05848 },
  { year: 1931, stockReturn: -0.387652, bondReturn: 0.094891, inflationRate: -0.081761 },
  { year: 1932, stockReturn: -0.020391, bondReturn: 0.159366, inflationRate: -0.083916 },
  { year: 1933, stockReturn: 0.443211, bondReturn: 0.021243, inflationRate: 0.023256 },
  { year: 1934, stockReturn: -0.097436, bondReturn: 0.03914, inflationRate: 0.015152 },
  { year: 1935, stockReturn: 0.443006, bondReturn: 0.021642, inflationRate: 0.014706 },
  { year: 1936, stockReturn: 0.264419, bondReturn: 0.007278, inflationRate: 0.014493 },
  { year: 1937, stockReturn: -0.355791, bondReturn: 0.013072, inflationRate: 0.021277 },
  { year: 1938, stockReturn: 0.203451, bondReturn: 0.054264, inflationRate: -0.014085 },
  { year: 1939, stockReturn: 0.032076, bondReturn: 0.033311, inflationRate: 0.0 },
  { year: 1940, stockReturn: -0.108161, bondReturn: 0.026803, inflationRate: 0.014388 },
  { year: 1941, stockReturn: -0.19387, bondReturn: -0.110217, inflationRate: 0.099291 },
  { year: 1942, stockReturn: 0.060726, bondReturn: -0.050141, inflationRate: 0.076433 },
  { year: 1943, stockReturn: 0.158207, bondReturn: -0.006682, inflationRate: 0.029586 },
  { year: 1944, stockReturn: 0.131699, bondReturn: 0.008955, inflationRate: 0.022989 },
  { year: 1945, stockReturn: 0.306784, bondReturn: 0.014022, inflationRate: 0.022472 },
  { year: 1946, stockReturn: -0.262146, bondReturn: -0.140058, inflationRate: 0.181319 },
  { year: 1947, stockReturn: -0.048781, bondReturn: -0.075042, inflationRate: 0.088372 },
  { year: 1948, stockReturn: 0.060125, bondReturn: 0.015697, inflationRate: 0.016878 },
  { year: 1949, stockReturn: 0.165323, bondReturn: 0.037906, inflationRate: -0.016667 },
  { year: 1950, stockReturn: 0.171139, bondReturn: -0.057908, inflationRate: 0.06383 },
  { year: 1951, stockReturn: 0.125114, bondReturn: -0.027027, inflationRate: 0.043307 },
  { year: 1952, stockReturn: 0.127156, bondReturn: 0.005736, inflationRate: 0.007547 },
  { year: 1953, stockReturn: -0.011154, bondReturn: 0.035951, inflationRate: 0.011278 },
  { year: 1954, stockReturn: 0.447833, bondReturn: 0.027076, inflationRate: -0.007435 },
  { year: 1955, stockReturn: 0.315939, bondReturn: -0.008842, inflationRate: 0.003745 },
  { year: 1956, stockReturn: 0.057498, bondReturn: -0.057522, inflationRate: 0.029851 },
  { year: 1957, stockReturn: -0.105368, bondReturn: 0.025926, inflationRate: 0.028986 },
  { year: 1958, stockReturn: 0.33248, bondReturn: -0.043986, inflationRate: 0.01049 },
  { year: 1959, stockReturn: 0.077788, bondReturn: -0.028544, inflationRate: 0.013793 },
  { year: 1960, stockReturn: -0.006342, bondReturn: 0.096491, inflationRate: 0.017065 },
  { year: 1961, stockReturn: 0.225762, bondReturn: 0.010638, inflationRate: 0.006711 },
  { year: 1962, stockReturn: -0.076906, bondReturn: 0.042032, inflationRate: 0.013333 },
  { year: 1963, stockReturn: 0.154247, bondReturn: -0.004177, inflationRate: 0.016447 },
  { year: 1964, stockReturn: 0.117326, bondReturn: 0.027685, inflationRate: 0.009709 },
  { year: 1965, stockReturn: 0.073879, bondReturn: -0.014646, inflationRate: 0.019231 },
  { year: 1966, stockReturn: -0.131209, bondReturn: -0.007395, inflationRate: 0.034591 },
  { year: 1967, stockReturn: 0.127154, bondReturn: -0.067906, inflationRate: 0.030395 },
  { year: 1968, stockReturn: 0.106767, bondReturn: -0.026587, inflationRate: 0.041056 },
  { year: 1969, stockReturn: -0.131295, bondReturn: -0.10642, inflationRate: 0.058989 },
  { year: 1970, stockReturn: -0.018954, bondReturn: 0.120792, inflationRate: 0.05291 },
  { year: 1971, stockReturn: 0.057136, bondReturn: 0.047826, inflationRate: 0.032663 },
  { year: 1972, stockReturn: 0.128715, bondReturn: -0.007444, inflationRate: 0.034063 },
  { year: 1973, stockReturn: -0.240884, bondReturn: -0.038494, inflationRate: 0.084507 },
  { year: 1974, stockReturn: -0.347532, bondReturn: -0.067556, inflationRate: 0.113734 },
  { year: 1975, stockReturn: 0.192851, bondReturn: -0.024833, inflationRate: 0.065259 },
  { year: 1976, stockReturn: 0.068467, bondReturn: 0.08908, inflationRate: 0.046763 },
  { year: 1977, stockReturn: -0.112634, bondReturn: -0.025225, inflationRate: 0.061538 },
  { year: 1978, stockReturn: 0.030283, bondReturn: -0.070621, inflationRate: 0.0832 },
  { year: 1979, stockReturn: 0.009889, bondReturn: -0.107143, inflationRate: 0.122987 },
  { year: 1980, stockReturn: 0.136338, bondReturn: -0.11543, inflationRate: 0.109254 },
  { year: 1981, stockReturn: -0.097712, bondReturn: -0.015707, inflationRate: 0.08046 },
  { year: 1982, stockReturn: 0.209839, bondReturn: 0.364138, inflationRate: 0.034995 },
  { year: 1983, stockReturn: 0.144222, bondReturn: -0.016, inflationRate: 0.035787 },
  { year: 1984, stockReturn: -0.002333, bondReturn: 0.095286, inflationRate: 0.033366 },
  { year: 1985, stockReturn: 0.210994, bondReturn: 0.211191, inflationRate: 0.036019 },
  { year: 1986, stockReturn: 0.221878, bondReturn: 0.222878, inflationRate: 0.008212 },
  { year: 1987, stockReturn: -0.097632, bondReturn: -0.088005, inflationRate: 0.03777 },
  { year: 1988, stockReturn: 0.094156, bondReturn: 0.010303, inflationRate: 0.041487 },
  { year: 1989, stockReturn: 0.208021, bondReturn: 0.127538, inflationRate: 0.041288 },
  { year: 1990, stockReturn: -0.049203, bondReturn: 0.038818, inflationRate: 0.050235 },
  { year: 1991, stockReturn: 0.199698, bondReturn: 0.123815, inflationRate: 0.024517 },
  { year: 1992, stockReturn: 0.047072, bondReturn: 0.056567, inflationRate: 0.027516 },
  { year: 1993, stockReturn: 0.073931, bondReturn: 0.096507, inflationRate: 0.02244 },
  { year: 1994, stockReturn: -0.035666, bondReturn: -0.102339, inflationRate: 0.02394 },
  { year: 1995, stockReturn: 0.322912, bondReturn: 0.206114, inflationRate: 0.021291 },
  { year: 1996, stockReturn: 0.200938, bondReturn: -0.016839, inflationRate: 0.027202 },
  { year: 1997, stockReturn: 0.258731, bondReturn: 0.106223, inflationRate: 0.013828 },
  { year: 1998, stockReturn: 0.234382, bondReturn: 0.108155, inflationRate: 0.014233 },
  { year: 1999, stockReturn: 0.129661, bondReturn: -0.08817, inflationRate: 0.024346 },
  { year: 2000, stockReturn: -0.084623, bondReturn: 0.139137, inflationRate: 0.030806 },
  { year: 2001, stockReturn: -0.140008, bondReturn: 0.04242, inflationRate: 0.009138 },
  { year: 2002, stockReturn: -0.216293, bondReturn: 0.106218, inflationRate: 0.021457 },
  { year: 2003, stockReturn: 0.208065, bondReturn: 0.003236, inflationRate: 0.014309 },
  { year: 2004, stockReturn: 0.046276, bondReturn: 0.004532, inflationRate: 0.027538 },
  { year: 2005, stockReturn: 0.051835, bondReturn: -0.012973, inflationRate: 0.031987 },
  { year: 2006, stockReturn: 0.106602, bondReturn: 0.015286, inflationRate: 0.01765 },
  { year: 2007, stockReturn: 0.017503, bondReturn: 0.059533, inflationRate: 0.037645 },
  { year: 2008, stockReturn: -0.346512, bondReturn: 0.160266, inflationRate: -0.004027 },
  { year: 2009, stockReturn: 0.285491, bondReturn: -0.081528, inflationRate: 0.022781 },
  { year: 2010, stockReturn: 0.112121, bondReturn: 0.054859, inflationRate: 0.011491 },
  { year: 2011, stockReturn: -0.036966, bondReturn: 0.130691, inflationRate: 0.024748 },
  { year: 2012, stockReturn: 0.100405, bondReturn: 0.026295, inflationRate: 0.012926 },
  { year: 2013, stockReturn: 0.229242, bondReturn: -0.075727, inflationRate: 0.012029 },
  { year: 2014, stockReturn: 0.143128, bondReturn: 0.079389, inflationRate: 0.003805 },
  { year: 2015, stockReturn: 0.019521, bondReturn: -0.024808, inflationRate: 0.012066 },
  { year: 2016, stockReturn: 0.171621, bondReturn: -0.037938, inflationRate: 0.019036 },
  { year: 2017, stockReturn: 0.174157, bondReturn: 0.008683, inflationRate: 0.015154 },
  { year: 2018, stockReturn: -0.076284, bondReturn: -0.008776, inflationRate: 0.013555 },
  { year: 2019, stockReturn: 0.2146, bondReturn: 0.076171, inflationRate: 0.020897 },
  { year: 2020, stockReturn: 0.135586, bondReturn: 0.077082, inflationRate: 0.009691 },
  { year: 2021, stockReturn: 0.170669, bondReturn: -0.083674, inflationRate: 0.065831 },
  { year: 2022, stockReturn: -0.177813, bondReturn: -0.174087, inflationRate: 0.055664 },
  { year: 2023, stockReturn: 0.170741, bondReturn: -0.030031, inflationRate: 0.025337 },
  { year: 2024, stockReturn: 0.234695, bondReturn: -0.012048, inflationRate: 0.023312 },
];

/**
 * Get historical data for a specific year range
 */
export function getHistoricalData(startYear: number, endYear: number): HistoricalYearData[] {
  return historicalData.filter((data) => data.year >= startYear && data.year <= endYear);
}

/**
 * Get the full date range of available historical data
 */
export function getDataRange(): { startYear: number; endYear: number } {
  return {
    startYear: historicalData[0]?.year ?? 1871,
    endYear: historicalData[historicalData.length - 1]?.year ?? new Date().getFullYear(),
  };
}

/**
 * Calculate statistics for historical returns
 */
export function calculateHistoricalStats(data: HistoricalYearData[]) {
  if (data.length === 0) return null;

  const stockReturns = data.map((d) => d.stockReturn);
  const bondReturns = data.map((d) => d.bondReturn);
  const inflationRates = data.map((d) => d.inflationRate);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = (arr: number[]) => {
    const m = mean(arr);
    return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  };
  const stdDev = (arr: number[]) => Math.sqrt(variance(arr));

  return {
    stocks: {
      mean: mean(stockReturns),
      stdDev: stdDev(stockReturns),
      min: Math.min(...stockReturns),
      max: Math.max(...stockReturns),
    },
    bonds: {
      mean: mean(bondReturns),
      stdDev: stdDev(bondReturns),
      min: Math.min(...bondReturns),
      max: Math.max(...bondReturns),
    },
    inflation: {
      mean: mean(inflationRates),
      stdDev: stdDev(inflationRates),
      min: Math.min(...inflationRates),
      max: Math.max(...inflationRates),
    },
  };
}
