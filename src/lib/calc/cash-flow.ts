export interface CashFlow {
  // Money coming in (real dollars)
  income: number; // All income sources combined
  contributions: number; // Money going into portfolio

  // Money going out (real dollars)
  expenses: number; // All living expenses
  withdrawals: number; // Money coming out of portfolio
  taxes: number; // Total taxes paid
}
