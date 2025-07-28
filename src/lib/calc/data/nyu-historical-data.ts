/**
 * NYU Stern historical financial market data (1928-present)
 *
 * Real annual returns for stocks, bonds, cash, plus inflation rates.
 * Data source: NYU Stern School of Business historical dataset
 *
 * Generated automatically - do not edit manually.
 */

export interface NyuHistoricalYearData {
  year: number;
  stockReturn: number; // Real annual stock return (S&P 500 with dividends)
  bondReturn: number; // Real annual bond return (10-year T.Bonds)
  cashReturn: number; // Real annual cash return (3-month T.Bills)
  inflationRate: number; // Annual inflation rate
}

export const nyuHistoricalData: NyuHistoricalYearData[] = [
  { year: 1928, stockReturn: 0.4549, bondReturn: 0.0201, cashReturn: 0.0429, inflationRate: -0.0116 },
  { year: 1929, stockReturn: -0.0883, bondReturn: 0.036, cashReturn: 0.0256, inflationRate: 0.0058 },
  { year: 1930, stockReturn: -0.2001, bondReturn: 0.1168, cashReturn: 0.1169, inflationRate: -0.064 },
  { year: 1931, stockReturn: -0.3807, bondReturn: 0.0745, cashReturn: 0.1282, inflationRate: -0.0932 },
  { year: 1932, stockReturn: 0.0182, bondReturn: 0.2125, cashReturn: 0.1264, inflationRate: -0.1027 },
  { year: 1933, stockReturn: 0.4885, bondReturn: 0.0108, cashReturn: 0.002, inflationRate: 0.0076 },
  { year: 1934, stockReturn: -0.0266, bondReturn: 0.0635, cashReturn: -0.0122, inflationRate: 0.0152 },
  { year: 1935, stockReturn: 0.4249, bondReturn: 0.0144, cashReturn: -0.0274, inflationRate: 0.0299 },
  { year: 1936, stockReturn: 0.3006, bondReturn: 0.0352, cashReturn: -0.0126, inflationRate: 0.0145 },
  { year: 1937, stockReturn: -0.3713, bondReturn: -0.0144, cashReturn: -0.0251, inflationRate: 0.0286 },
  { year: 1938, stockReturn: 0.3298, bondReturn: 0.0719, cashReturn: 0.0292, inflationRate: -0.0278 },
  { year: 1939, stockReturn: -0.011, bondReturn: 0.0441, cashReturn: 0.0005, inflationRate: 0.0 },
  { year: 1940, stockReturn: -0.1131, bondReturn: 0.0465, cashReturn: -0.0067, inflationRate: 0.0071 },
  { year: 1941, stockReturn: -0.2065, bondReturn: -0.1087, cashReturn: -0.0891, inflationRate: 0.0993 },
  { year: 1942, stockReturn: 0.093, bondReturn: -0.0618, cashReturn: -0.0797, inflationRate: 0.0903 },
  { year: 1943, stockReturn: 0.2147, bondReturn: -0.0046, cashReturn: -0.025, inflationRate: 0.0296 },
  { year: 1944, stockReturn: 0.1636, bondReturn: 0.0027, cashReturn: -0.0188, inflationRate: 0.023 },
  { year: 1945, stockReturn: 0.3284, bondReturn: 0.0152, cashReturn: -0.0183, inflationRate: 0.0225 },
  { year: 1946, stockReturn: -0.2248, bondReturn: -0.127, cashReturn: -0.1503, inflationRate: 0.1813 },
  { year: 1947, stockReturn: -0.0334, bondReturn: -0.0727, cashReturn: -0.0757, inflationRate: 0.0884 },
  { year: 1948, stockReturn: 0.0263, bondReturn: -0.0101, cashReturn: -0.0189, inflationRate: 0.0299 },
  { year: 1949, stockReturn: 0.2081, bondReturn: 0.0688, cashReturn: 0.0326, inflationRate: -0.0207 },
  { year: 1950, stockReturn: 0.2348, bondReturn: -0.0519, cashReturn: -0.0446, inflationRate: 0.0593 },
  { year: 1951, stockReturn: 0.1668, bondReturn: -0.0594, cashReturn: -0.0423, inflationRate: 0.06 },
  { year: 1952, stockReturn: 0.1727, bondReturn: 0.015, cashReturn: 0.0096, inflationRate: 0.0075 },
  { year: 1953, stockReturn: -0.0194, bondReturn: 0.0337, cashReturn: 0.0113, inflationRate: 0.0075 },
  { year: 1954, stockReturn: 0.5371, bondReturn: 0.0406, cashReturn: 0.0169, inflationRate: -0.0074 },
  { year: 1955, stockReturn: 0.321, bondReturn: -0.017, cashReturn: 0.0134, inflationRate: 0.0037 },
  { year: 1956, stockReturn: 0.0433, bondReturn: -0.0509, cashReturn: -0.0035, inflationRate: 0.0299 },
  { year: 1957, stockReturn: -0.1298, bondReturn: 0.0379, cashReturn: 0.0032, inflationRate: 0.029 },
  { year: 1958, stockReturn: 0.4123, bondReturn: -0.0379, cashReturn: 0.0001, inflationRate: 0.0176 },
  { year: 1959, stockReturn: 0.1015, bondReturn: -0.043, cashReturn: 0.0163, inflationRate: 0.0173 },
  { year: 1960, stockReturn: -0.0101, bondReturn: 0.1014, cashReturn: 0.0149, inflationRate: 0.0136 },
  { year: 1961, stockReturn: 0.2579, bondReturn: 0.0138, cashReturn: 0.0167, inflationRate: 0.0067 },
  { year: 1962, stockReturn: -0.1001, bondReturn: 0.043, cashReturn: 0.0142, inflationRate: 0.0133 },
  { year: 1963, stockReturn: 0.2063, bondReturn: 0.0004, cashReturn: 0.0149, inflationRate: 0.0164 },
  { year: 1964, stockReturn: 0.153, bondReturn: 0.0273, cashReturn: 0.0255, inflationRate: 0.0097 },
  { year: 1965, stockReturn: 0.1028, bondReturn: -0.0118, cashReturn: 0.0199, inflationRate: 0.0192 },
  { year: 1966, stockReturn: -0.1298, bondReturn: -0.0053, cashReturn: 0.0135, inflationRate: 0.0346 },
  { year: 1967, stockReturn: 0.2015, bondReturn: -0.0448, cashReturn: 0.0122, inflationRate: 0.0304 },
  { year: 1968, stockReturn: 0.0582, bondReturn: -0.0138, cashReturn: 0.0059, inflationRate: 0.0472 },
  { year: 1969, stockReturn: -0.136, bondReturn: -0.1056, cashReturn: 0.0044, inflationRate: 0.062 },
  { year: 1970, stockReturn: -0.019, bondReturn: 0.1059, cashReturn: 0.0078, inflationRate: 0.0557 },
  { year: 1971, stockReturn: 0.1061, bondReturn: 0.0631, cashReturn: 0.0103, inflationRate: 0.0327 },
  { year: 1972, stockReturn: 0.1484, bondReturn: -0.0057, cashReturn: 0.0063, inflationRate: 0.0341 },
  { year: 1973, stockReturn: -0.2117, bondReturn: -0.0464, cashReturn: -0.0154, inflationRate: 0.0871 },
  { year: 1974, stockReturn: -0.3404, bondReturn: -0.0921, cashReturn: -0.04, inflationRate: 0.1234 },
  { year: 1975, stockReturn: 0.2811, bondReturn: -0.0312, cashReturn: -0.0108, inflationRate: 0.0694 },
  { year: 1976, stockReturn: 0.1809, bondReturn: 0.106, cashReturn: 0.0011, inflationRate: 0.0486 },
  { year: 1977, stockReturn: -0.1282, bondReturn: -0.0507, cashReturn: -0.0135, inflationRate: 0.067 },
  { year: 1978, stockReturn: -0.023, bondReturn: -0.0899, cashReturn: -0.0169, inflationRate: 0.0902 },
  { year: 1979, stockReturn: 0.0461, bondReturn: -0.1114, cashReturn: -0.0286, inflationRate: 0.1329 },
  { year: 1980, stockReturn: 0.1708, bondReturn: -0.1378, cashReturn: -0.01, inflationRate: 0.1252 },
  { year: 1981, stockReturn: -0.1251, bondReturn: -0.0066, cashReturn: 0.0469, inflationRate: 0.0892 },
  { year: 1982, stockReturn: 0.1598, bondReturn: 0.2792, cashReturn: 0.0652, inflationRate: 0.0383 },
  { year: 1983, stockReturn: 0.1787, bondReturn: -0.0057, cashReturn: 0.0465, inflationRate: 0.0379 },
  { year: 1984, stockReturn: 0.0211, bondReturn: 0.0941, cashReturn: 0.0538, inflationRate: 0.0395 },
  { year: 1985, stockReturn: 0.2643, bondReturn: 0.2111, cashReturn: 0.0354, inflationRate: 0.038 },
  { year: 1986, stockReturn: 0.1721, bondReturn: 0.2293, cashReturn: 0.0482, inflationRate: 0.011 },
  { year: 1987, stockReturn: 0.0132, bondReturn: -0.09, cashReturn: 0.0129, inflationRate: 0.0443 },
  { year: 1988, stockReturn: 0.116, bondReturn: 0.0364, cashReturn: 0.0215, inflationRate: 0.0442 },
  { year: 1989, stockReturn: 0.2564, bondReturn: 0.1247, cashReturn: 0.0331, inflationRate: 0.0465 },
  { year: 1990, stockReturn: -0.0864, bondReturn: 0.0012, cashReturn: 0.0131, inflationRate: 0.0611 },
  { year: 1991, stockReturn: 0.2636, bondReturn: 0.1159, cashReturn: 0.0224, inflationRate: 0.0306 },
  { year: 1992, stockReturn: 0.0446, bondReturn: 0.0628, cashReturn: 0.0052, inflationRate: 0.029 },
  { year: 1993, stockReturn: 0.0703, bondReturn: 0.1116, cashReturn: 0.0024, inflationRate: 0.0275 },
  { year: 1994, stockReturn: -0.0131, bondReturn: -0.1043, cashReturn: 0.0154, inflationRate: 0.0267 },
  { year: 1995, stockReturn: 0.338, bondReturn: 0.2042, cashReturn: 0.0288, inflationRate: 0.0254 },
  { year: 1996, stockReturn: 0.1874, bondReturn: -0.0183, cashReturn: 0.0163, inflationRate: 0.0332 },
  { year: 1997, stockReturn: 0.3088, bondReturn: 0.081, cashReturn: 0.033, inflationRate: 0.017 },
  { year: 1998, stockReturn: 0.263, bondReturn: 0.131, cashReturn: 0.0311, inflationRate: 0.0161 },
  { year: 1999, stockReturn: 0.1772, bondReturn: -0.1065, cashReturn: 0.019, inflationRate: 0.0268 },
  { year: 2000, stockReturn: -0.1201, bondReturn: 0.1283, cashReturn: 0.0235, inflationRate: 0.0339 },
  { year: 2001, stockReturn: -0.132, bondReturn: 0.0396, cashReturn: 0.0182, inflationRate: 0.0155 },
  { year: 2002, stockReturn: -0.2378, bondReturn: 0.1244, cashReturn: -0.0075, inflationRate: 0.0238 },
  { year: 2003, stockReturn: 0.2599, bondReturn: -0.0148, cashReturn: -0.0086, inflationRate: 0.0188 },
  { year: 2004, stockReturn: 0.0725, bondReturn: 0.012, cashReturn: -0.0182, inflationRate: 0.0326 },
  { year: 2005, stockReturn: 0.0137, bondReturn: -0.0053, cashReturn: -0.0026, inflationRate: 0.0342 },
  { year: 2006, stockReturn: 0.1275, bondReturn: -0.0057, cashReturn: 0.0214, inflationRate: 0.0254 },
  { year: 2007, stockReturn: 0.0135, bondReturn: 0.0589, cashReturn: 0.0027, inflationRate: 0.0408 },
  { year: 2008, stockReturn: -0.3661, bondReturn: 0.1999, cashReturn: 0.0128, inflationRate: 0.0009 },
  { year: 2009, stockReturn: 0.226, bondReturn: -0.1347, cashReturn: -0.025, inflationRate: 0.0272 },
  { year: 2010, stockReturn: 0.1313, bondReturn: 0.0686, cashReturn: -0.0134, inflationRate: 0.015 },
  { year: 2011, stockReturn: -0.0084, bondReturn: 0.127, cashReturn: -0.0283, inflationRate: 0.0296 },
  { year: 2012, stockReturn: 0.1391, bondReturn: 0.0121, cashReturn: -0.0163, inflationRate: 0.0174 },
  { year: 2013, stockReturn: 0.3019, bondReturn: -0.1045, cashReturn: -0.0142, inflationRate: 0.015 },
  { year: 2014, stockReturn: 0.1267, bondReturn: 0.0991, cashReturn: -0.0072, inflationRate: 0.0076 },
  { year: 2015, stockReturn: 0.0064, bondReturn: 0.0055, cashReturn: -0.0067, inflationRate: 0.0073 },
  { year: 2016, stockReturn: 0.095, bondReturn: -0.0136, cashReturn: -0.0172, inflationRate: 0.0207 },
  { year: 2017, stockReturn: 0.1909, bondReturn: 0.0068, cashReturn: -0.0115, inflationRate: 0.0211 },
  { year: 2018, stockReturn: -0.0602, bondReturn: -0.0189, cashReturn: 0.0003, inflationRate: 0.0191 },
  { year: 2019, stockReturn: 0.2828, bondReturn: 0.0719, cashReturn: -0.0022, inflationRate: 0.0229 },
  { year: 2020, stockReturn: 0.1644, bondReturn: 0.0984, cashReturn: -0.0099, inflationRate: 0.0136 },
  { year: 2021, stockReturn: 0.2002, bondReturn: -0.107, cashReturn: -0.0653, inflationRate: 0.0704 },
  { year: 2022, stockReturn: -0.2301, bondReturn: -0.2281, cashReturn: -0.0416, inflationRate: 0.0645 },
  { year: 2023, stockReturn: 0.2197, bondReturn: 0.0051, cashReturn: 0.0166, inflationRate: 0.0335 },
  { year: 2024, stockReturn: 0.2154, bondReturn: -0.0427, cashReturn: 0.0216, inflationRate: 0.0275 },
];

/**
 * Get NYU historical data for a specific year range
 */
export function getNyuHistoricalData(startYear: number, endYear: number): NyuHistoricalYearData[] {
  return nyuHistoricalData.filter((data) => data.year >= startYear && data.year <= endYear);
}

/**
 * Get the full date range of available NYU historical data
 */
export function getNyuDataRange(): { startYear: number; endYear: number } {
  return {
    startYear: nyuHistoricalData[0].year,
    endYear: nyuHistoricalData[nyuHistoricalData.length - 1].year,
  };
}

/**
 * Calculate statistics for NYU historical returns
 */
export function calculateNyuHistoricalStats(data: NyuHistoricalYearData[]) {
  if (data.length === 0) return null;

  const stockReturns = data.map((d) => d.stockReturn);
  const bondReturns = data.map((d) => d.bondReturn);
  const cashReturns = data.map((d) => d.cashReturn);
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
    cash: {
      mean: mean(cashReturns),
      stdDev: stdDev(cashReturns),
      min: Math.min(...cashReturns),
      max: Math.max(...cashReturns),
    },
    inflation: {
      mean: mean(inflationRates),
      stdDev: stdDev(inflationRates),
      min: Math.min(...inflationRates),
      max: Math.max(...inflationRates),
    },
  };
}
