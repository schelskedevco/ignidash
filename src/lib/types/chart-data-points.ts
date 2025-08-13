export interface StochasticCashFlowChartDataPoint {
  age: number;
  name: string;
  amount: number;
}

export interface StochasticReturnsChartDataPoint {
  age: number;
  name: string;
  rate: number | null;
  amount: number | null;
}

export interface StochasticWithdrawalsChartDataPoint {
  age: number;
  name: string;
  rate: number | null;
  amount: number | null;
}
