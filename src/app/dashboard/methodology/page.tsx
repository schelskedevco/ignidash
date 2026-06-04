import MainArea from '@/components/layout/main-area';

export default function MethodologyPage() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-base/7 font-semibold text-rose-600 dark:text-rose-400">Documentation</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl dark:text-white">Simulation Methodology</h1>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
            How Ignidash models your financial future — the math, assumptions, and algorithms behind every projection.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-16 rounded-lg border border-stone-200 bg-stone-50 p-6 dark:border-stone-700 dark:bg-stone-800/50">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">On this page</h2>
          <ul className="space-y-1.5 text-sm">
            {[
              { href: '#overview', label: 'Overview' },
              { href: '#engine-architecture', label: 'Engine Architecture' },
              { href: '#return-models', label: 'Return Rate Models' },
              { href: '#correlation-structure', label: 'Correlation Structure' },
              { href: '#account-types', label: 'Account Types & Tax Treatment' },
              { href: '#tax-engine', label: 'Tax Calculation Engine' },
              { href: '#tax-convergence', label: 'Tax Convergence Loop' },
              { href: '#contribution-waterfall', label: 'Contribution & Withdrawal Waterfall' },
              { href: '#inflation', label: 'Inflation Modeling' },
              { href: '#glide-path', label: 'Glide Path Allocation' },
              { href: '#assumptions', label: 'Key Assumptions & Limitations' },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block rounded-md px-3 py-1.5 text-stone-600 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700/60 dark:hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 1. Overview */}
        <section id="overview" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">1. Overview</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            Ignidash runs a month-by-month financial simulation that models the full lifecycle of a retirement plan. Each year, the engine
            reconciles taxes, applies investment returns, and tracks every financial domain: income, expenses, accounts, debts, and physical
            assets.
          </p>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            The simulator supports three return models — <strong>fixed returns</strong> for simple what-if scenarios,{' '}
            <strong>stochastic (Monte Carlo) returns</strong> with correlated random sampling for probabilistic analysis, and{' '}
            <strong>historical backtest returns</strong> that replay actual US market history from 1928–2024. Multi-simulation modes run
            hundreds or thousands of trials to produce probability distributions over outcomes.
          </p>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            All tax calculations model US federal law: ordinary income tax under IRC §1, long-term capital gains under IRC §1(h), the Net
            Investment Income Tax under IRC §1411, Social Security taxation under IRC §86, and early withdrawal penalties under IRC §72(t).
            State taxes are not currently modeled.
          </p>
        </section>

        {/* 2. Engine Architecture */}
        <section id="engine-architecture" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">2. Engine Architecture</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            The simulation proceeds as a discrete-time loop with <strong>monthly</strong> steps and <strong>annual</strong> tax
            reconciliation.
          </p>

          <div className="mt-6 overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">Monthly Loop</h3>
            </div>
            <div className="border-t border-stone-200 px-6 py-4 dark:border-stone-700">
              <ol className="ml-4 list-decimal space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li>Increment time (month, year, fractional age)</li>
                <li>Process Required Minimum Distributions (RMDs) if applicable</li>
                <li>Generate annual investment returns (converted to monthly via geometric compounding)</li>
                <li>Apply returns proportionally to each account</li>
                <li>Process income sources (wages, SS, pensions, etc.)</li>
                <li>Process expenses (living costs, healthcare, discretionary)</li>
                <li>Adjust debts for inflation and accrue interest</li>
                <li>Process physical assets (appreciation, loans)</li>
                <li>Compute net cash flow and route to contributions or withdrawals</li>
                <li>Handle discretionary surplus spending</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">
                Annual Tax Reconciliation
              </h3>
            </div>
            <div className="border-t border-stone-200 px-6 py-4 dark:border-stone-700">
              <ol className="ml-4 list-decimal space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li>Collect annual aggregates from all domains</li>
                <li>Compute federal tax liability (income + capital gains + NIIT + SS taxation + penalties)</li>
                <li>If taxes due, withdraw from portfolio to cover them</li>
                <li>Iterate up to 10 times until remaining tax ≤ $1 (convergence)</li>
                <li>Handle any tax refund as discretionary spending</li>
                <li>
                  Store annual{' '}
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs dark:bg-stone-800">SimulationDataPoint</code> in
                  results
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400">Data Point Structure</h3>
            </div>
            <div className="border-t border-stone-200 px-6 py-4 dark:border-stone-700">
              <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
                Each year produces a{' '}
                <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs dark:bg-stone-800">SimulationDataPoint</code> with:
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
                <li>
                  <strong className="text-stone-900 dark:text-white">portfolio</strong> — Total value, per-account balances, contributions,
                  withdrawals, realized gains, RMDs, shortfalls
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">incomes</strong> — All income sources with withheld amounts and FICA
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">expenses</strong> — All expense outflows
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">debts</strong> — Loan balances, payments, interest, unpaid interest
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">physicalAssets</strong> — Asset values, loans, appreciation, sale
                  proceeds
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">phase</strong> — &ldquo;accumulation&rdquo; or &ldquo;retirement&rdquo;
                  phase indicator
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">taxes</strong> — Full federal tax breakdown (income, capital gains,
                  NIIT, penalties, SS)
                </li>
                <li>
                  <strong className="text-stone-900 dark:text-white">returns</strong> — Realized returns, yields, and inflation for the year
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Return Rate Models */}
        <section id="return-models" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">3. Return Rate Models</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            Ignidash provides three strategies for generating yearly investment returns. Each converts annual real rates to monthly rates
            via geometric compounding:
          </p>
          <div className="mt-3 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            <span className="text-stone-600 dark:text-stone-400">monthlyRate = (1 + annualRealRate)</span>
            <sup className="text-stone-600 dark:text-stone-400">1/12</sup>
            <span className="text-stone-600 dark:text-stone-400"> - 1</span>
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Fixed Returns</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Returns the user-specified nominal rates every year, converted to real returns using the Fisher equation:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            realReturn = (1 + nominalReturn) / (1 + inflationRate) - 1
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Best for deterministic what-if analysis where you want to eliminate return uncertainty.
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Stochastic Returns (Monte Carlo)</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Generates correlated random returns each year using a multivariate normal distribution with Cholesky decomposition. Six
            variables are simulated simultaneously:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>Stock returns (log-normal) — mean = user assumption, σ = 18%</li>
            <li>Bond returns (normal) — mean = user assumption, σ = 6%</li>
            <li>Cash returns (normal) — mean = user assumption, σ = 3%</li>
            <li>Inflation rate (normal) — mean = user assumption, σ = 4%</li>
            <li>Bond yield (log-normal) — mean = user assumption, σ = 1.5%</li>
            <li>Stock dividend yield (log-normal) — mean = user assumption, σ = 1%</li>
          </ul>
          <p className="mt-3 text-stone-600 dark:text-stone-400">Log-normal variables are transformed from normal space:</p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            σ<sub>log</sub> = √(ln(1 + σ² / μ²))
            <br />μ<sub>log</sub> = ln(μ) - ½ σ<sub>log</sub>²<br />
            return = exp(μ<sub>log</sub> + σ<sub>log</sub> · Z) - 1
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            The log-normal distribution ensures stock returns and yields remain non-negative while still permitting significant volatility.
            Normal distributions are used for bond returns, cash returns, and inflation, which can go negative (nominal rates can be
            negative in low-rate environments).
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Historical Backtest Returns</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Replays actual historical market returns from the NYU Stern dataset (1928–2024), using real (inflation-adjusted) returns. A
            linear congruential generator (LCG) selects a random start year, and the simulation replays consecutive historical years
            sequentially. When the end of the historical data is reached, it wraps back to the beginning.
          </p>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            This produces scenario analysis based on actual market sequences — including the Great Depression, the 1970s stagflation, the
            2000 dot-com crash, and the 2008 financial crisis. Users can optionally pin the start year or set a different start year for the
            retirement phase.
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Simulation Modes</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
            <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-700">
              <thead className="bg-stone-50 dark:bg-stone-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Return Model</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Trials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">fixedReturns</td>
                  <td className="px-4 py-3">Fixed</td>
                  <td className="px-4 py-3">1</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">stochasticReturns</td>
                  <td className="px-4 py-3">Stochastic</td>
                  <td className="px-4 py-3">1</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">historicalReturns</td>
                  <td className="px-4 py-3">Historical</td>
                  <td className="px-4 py-3">1</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">monteCarloStochasticReturns</td>
                  <td className="px-4 py-3">Stochastic</td>
                  <td className="px-4 py-3">configurable (default ~1000)</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">monteCarloHistoricalReturns</td>
                  <td className="px-4 py-3">Historical</td>
                  <td className="px-4 py-3">configurable (default ~1000)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Correlation Structure */}
        <section id="correlation-structure" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">4. Correlation Structure</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            In stochastic mode, the six simulated variables are correlated using parameters estimated from the modern era (1990–2024). This
            ensures that extreme events respect real-world relationships — for example, inflation and bond returns are negatively
            correlated, while cash returns and bond yields are positively correlated.
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Correlation Matrix</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700">
                  <th className="px-3 py-2 text-left font-semibold text-stone-500 dark:text-stone-400"></th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 dark:text-stone-400">Stocks</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 dark:text-stone-400">Bonds</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 dark:text-stone-400">Cash</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 dark:text-stone-400">Inflation</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 dark:text-stone-400">Bond Yield</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 dark:text-stone-400">Stock Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {[
                  ['Stocks', '1.0', '−0.10', '0.07', '−0.02', '0.02', '−0.27'],
                  ['Bonds', '−0.10', '1.0', '0.21', '−0.33', '0.04', '0.23'],
                  ['Cash', '0.07', '0.21', '1.0', '0.31', '0.81', '0.14'],
                  ['Inflation', '−0.02', '−0.33', '0.31', '1.0', '0.26', '0.01'],
                  ['Bond Yield', '0.02', '0.04', '0.81', '0.26', '1.0', '0.36'],
                  ['Stock Yield', '−0.27', '0.23', '0.14', '0.01', '0.36', '1.0'],
                ].map(([label, ...vals]) => (
                  <tr key={label} className="text-stone-600 dark:text-stone-400">
                    <td className="px-3 py-2 font-medium text-stone-900 dark:text-white">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right font-mono">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Cholesky Decomposition</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            To generate correlated random variates from independent standard normal samples, the engine computes the Cholesky decomposition
            of the correlation matrix C, producing a lower-triangular matrix L such that C = L · L<sup>T</sup>.
          </p>
          <p className="mt-2 text-stone-600 dark:text-stone-400">Given six independent N(0,1) samples Z, the correlated vector is:</p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">correlated = L · Z</div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">Where each element L[i][j] is computed as:</p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            L[i][i] = √(C[i][i] − Σ<sub>k&lt;i</sub> L[i][k]²)
            <br />
            L[i][j] = (C[i][j] − Σ<sub>k&lt;j</sub> L[i][k] · L[j][k]) / L[j][j]
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Random Number Generation</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            The simulation uses a Linear Congruential Generator (LCG) with glibc parameters:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            x<sub>n+1</sub> = (1103515245 · x<sub>n</sub> + 12345) mod 2³¹
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">Standard normal variates are generated via the Box-Muller transform:</p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            Z = √(−2 · ln(u₁)) · cos(2π · u₂) &nbsp;where u₁, u₂ ~ Uniform(0,1)
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Each Monte Carlo trial uses a unique seed with prime spacing (seed<sub>i</sub> = baseSeed + i · 1009) to avoid correlation
            between parallel simulation runs.
          </p>
        </section>

        {/* 5. Account Types & Tax Treatment */}
        <section id="account-types" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">5. Account Types &amp; Tax Treatment</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            Each investment account is categorized into one of four tax categories, which determines how contributions, withdrawals, and
            growth are taxed.
          </p>

          <div className="mt-6 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
            <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-700">
              <thead className="bg-stone-50 dark:bg-stone-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Account Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Tax Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Contributions</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Withdrawals</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">RMDs</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Early Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {[
                  ['Savings', 'cashSavings', 'Post-tax', 'None', 'No', 'No'],
                  ['Taxable Brokerage', 'taxable', 'Post-tax', 'Pro-rata realized gains', 'No', 'No'],
                  ['401(k) / IRA / 403(b)', 'taxDeferred', 'Pre-tax', 'Ordinary income', 'Yes (73+)', '10% if &lt;59.5'],
                  ['HSA', 'taxDeferred', 'Pre-tax', 'Tax-free if medical', 'Yes (65+)', '20% if &lt;65'],
                  [
                    'Roth 401(k) / Roth IRA',
                    'taxFree',
                    'Post-tax',
                    'Contributions first; earnings taxed if &lt;59.5',
                    'No',
                    '10% on earnings &lt;59.5',
                  ],
                ].map(([type, cat, contrib, withdraw, rmd, penalty]) => (
                  <tr key={type} className="text-stone-600 dark:text-stone-400">
                    <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">{type}</td>
                    <td className="px-4 py-3">{cat}</td>
                    <td className="px-4 py-3">{contrib}</td>
                    <td className="px-4 py-3">{withdraw}</td>
                    <td className="px-4 py-3">{rmd}</td>
                    <td className="px-4 py-3">{penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Cost Basis Tracking</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Taxable brokerage accounts track cost basis for capital gains calculation. Withdrawals realize gains on a{' '}
            <strong>pro-rata</strong> basis:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            realizedGains = withdrawn − withdrawn · costBasis / balance
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Roth accounts track contribution basis separately from earnings. Withdrawals are ordered as contributions first (always tax-free
            and penalty-free), then earnings. This matches the IRS ordering rules under IRC §408A(d).
          </p>
        </section>

        {/* 6. Tax Calculation Engine */}
        <section id="tax-engine" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">6. Tax Calculation Engine</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            The tax processor computes complete US federal tax liability for each simulation year, supporting three filing statuses: Single,
            Married Filing Jointly, and Head of Household.
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Income Categorization</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            All income is assembled and categorized into ordinary income and capital gains:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>
              <strong>Earned income</strong> — W-2 wages, subject to FICA (6.2% SS + 1.45% Medicare = 7.65%)
            </li>
            <li>
              <strong>Tax-deferred withdrawals</strong> — 401(k), IRA, 403(b), HSA — taxed as ordinary income
            </li>
            <li>
              <strong>Realized capital gains</strong> — From portfolio rebalancing and account withdrawals, taxed at preferential rates
            </li>
            <li>
              <strong>Qualified dividends &amp; interest</strong> — Taxed as capital gains and ordinary income respectively
            </li>
            <li>
              <strong>Social Security</strong> — Subject to modified taxation per IRC §86
            </li>
            <li>
              <strong>Tax-free income</strong> — Roth contributions, gifts, exempt income — no tax impact
            </li>
          </ul>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Above-the-Line Adjustments (AGI)</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Adjusted Gross Income is computed by applying these adjustments (in order):
          </p>
          <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>Tax-deferred contributions (401k, IRA, HSA) — subtracted from earned income</li>
            <li>Capital loss deduction — maximum $3,000/year against ordinary income; unlimited carryforward</li>
            <li>Section 121 exclusion — $250K (single/HOH) or $500K (MFJ) on primary residence gains</li>
          </ol>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Remaining adjustments are applied to capital gains if ordinary income is fully offset.
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Standard Deduction</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            The standard deduction (2024 base, indexed annually) is stacked first against ordinary income. Any remainder offsets capital
            gains:
          </p>
          <div className="mt-2 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
            <table className="min-w-full divide-y divide-stone-200 text-sm dark:divide-stone-700">
              <thead className="bg-stone-50 dark:bg-stone-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Filing Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-900 dark:text-white">Standard Deduction (2024)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3">Single</td>
                  <td className="px-4 py-3 font-mono">$14,600</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3">Married Filing Jointly</td>
                  <td className="px-4 py-3 font-mono">$29,200</td>
                </tr>
                <tr className="text-stone-600 dark:text-stone-400">
                  <td className="px-4 py-3">Head of Household</td>
                  <td className="px-4 py-3 font-mono">$21,900</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Ordinary Income Tax (IRC §1)</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Progressive brackets are applied to taxable ordinary income. The tax for each bracket is:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            taxableInBracket = max(0, min(income, bracket.max) − bracket.min)
            <br />
            totalTax += taxableInBracket · bracket.rate
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Brackets are indexed annually for inflation at the user&apos;s specified rate.
          </p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Capital Gains Tax (IRC §1(h))</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Long-term capital gains are stacked <strong>on top of</strong> ordinary income to determine the applicable bracket, but only the
            gains portion in each bracket is taxed at the capital gains rate:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            totalTaxableIncome = ordinaryIncome + capitalGains
            <br />
            <br />
            incomeInBracket = min(totalTaxableIncome, bracket.max) − bracket.min
            <br />
            ordinaryInBracket = max(0, min(ordinaryIncome, bracket.max) − bracket.min)
            <br />
            gainsInBracket = incomeInBracket − ordinaryInBracket
            <br />
            capitalGainsTax += gainsInBracket · bracket.rate
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Net Investment Income Tax (IRC §1411)</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            An additional 3.8% tax on the lesser of net investment income and MAGI over the threshold:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            nii = realizedGains + dividends + interest − capLossDeduction
            <br />
            magiOverThreshold = max(0, MAGI − threshold)
            <br />
            niit = min(nii, magiOverThreshold) · 0.038
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Social Security Taxation (IRC §86)</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Up to 85% of Social Security benefits may be taxable, determined by provisional income:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            provisionalIncome = AGI + taxExemptInterest + ½ · SSBenefits
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">For Single / Head of Household filers:</p>
          <ul className="mt-1 ml-4 list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>PI ≤ $25,000 → 0% taxable</li>
            <li>$25,000 &lt; PI ≤ $34,000 → lesser of 50% × (PI − $25,000) or 50% of SS benefits</li>
            <li>PI &gt; $34,000 → lesser of 85% of SS benefits or 50% × $9,000 + 85% × (PI − $34,000)</li>
          </ul>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Married Filing Jointly thresholds: $32,000 / $44,000.</p>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Early Withdrawal Penalties</h3>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>
              <strong>Tax-deferred (401k/IRA)</strong> — 10% penalty on full withdrawal amount if under age 59½
            </li>
            <li>
              <strong>Roth earnings</strong> — 10% on earnings portion if under 59½ (contributions always penalty-free)
            </li>
            <li>
              <strong>HSA (non-medical)</strong> — 20% penalty if under age 65
            </li>
          </ul>
        </section>

        {/* 7. Tax Convergence Loop */}
        <section id="tax-convergence" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">7. Tax Convergence Loop</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            A key challenge in retirement simulation is the <strong>circular dependency</strong>
            between taxes and withdrawals: withdrawing from tax-deferred accounts to pay taxes generates additional taxable income, which
            increases the tax liability, requiring further withdrawals.
          </p>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            The engine resolves this with an <strong>iterative convergence loop</strong>:
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
            <div className="border-t border-stone-200 px-6 py-4 dark:border-stone-700">
              <ol className="ml-4 list-decimal space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li>Compute tax liability based on current portfolio and income</li>
                <li>If taxes due &gt; $0, withdraw from portfolio using the withdrawal waterfall</li>
                <li>Recalculate taxes (the withdrawal may have generated new taxable income)</li>
                <li>
                  If remaining tax due ≤ <strong>$1</strong>, mark as converged
                </li>
                <li>
                  Otherwise, repeat steps 2–4, up to <strong>10 iterations</strong> maximum
                </li>
              </ol>
            </div>
          </div>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            In practice, convergence typically occurs within 3–4 iterations. The $1 threshold is negligible in the context of total
            portfolio value and avoids infinite loops from floating-point arithmetic.
          </p>
        </section>

        {/* 8. Contribution & Withdrawal Waterfall */}
        <section id="contribution-waterfall" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">8. Contribution &amp; Withdrawal Waterfall</h2>

          <h3 className="mt-6 text-lg font-semibold text-stone-900 dark:text-white">Positive Cash Flow → Contributions</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            When income exceeds expenses (net cash flow is positive), funds are routed in priority order:
          </p>
          <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>Repay any outstanding shortfall from prior months with insufficient funds</li>
            <li>
              Apply contribution rules by priority rank: 401(k) up to employee limit → employer match → HSA → 403(b)/IRA → remaining to
              savings or discretionary
            </li>
            <li>
              New contributions are allocated according to the <strong>target asset allocation</strong>:
            </li>
          </ol>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            stocksContributed = amount · targetStocks%
            <br />
            bondsContributed = amount · targetBonds%
          </div>

          <h3 className="mt-8 text-lg font-semibold text-stone-900 dark:text-white">Negative Cash Flow → Withdrawals</h3>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            When expenses exceed income, withdrawals follow a <strong>tax-optimized sequencing</strong>
            that minimizes tax impact:
          </p>

          <h4 className="mt-4 font-medium text-stone-900 dark:text-white">Before age 59½:</h4>
          <ol className="mt-1 ml-4 list-decimal space-y-0.5 text-sm text-stone-600 dark:text-stone-400">
            <li>Savings account (cash)</li>
            <li>Taxable brokerage (pro-rata realized gains)</li>
            <li>Roth contributions only (tax/penalty-free)</li>
            <li>Tax-deferred (401k/IRA) — ordinary income + 10% penalty</li>
            <li>Roth earnings — 10% penalty on earnings</li>
            <li>HSA — 20% penalty if non-medical and under 65</li>
          </ol>

          <h4 className="mt-4 font-medium text-stone-900 dark:text-white">After age 59½:</h4>
          <ol className="mt-1 ml-4 list-decimal space-y-0.5 text-sm text-stone-600 dark:text-stone-400">
            <li>Savings account (cash)</li>
            <li>Tax-deferred (401k/IRA) — ordinary income, no penalty</li>
            <li>Taxable brokerage (pro-rata realized gains)</li>
            <li>Roth (all) — tax-free</li>
            <li>HSA</li>
          </ol>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Withdrawals use the <strong>inverse target allocation</strong> to determine the stock/bond/cash mix removed from each account,
            ensuring the portfolio rebalances toward its target allocation.
          </p>
        </section>

        {/* 9. Inflation Modeling */}
        <section id="inflation" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">9. Inflation Modeling</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">Inflation is modeled consistently across all simulation modes:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            <li>
              <strong>Fixed mode:</strong> User-specified constant inflation rate
            </li>
            <li>
              <strong>Stochastic mode:</strong> Inflation drawn from a normal distribution with user-mean and 4% volatility, correlated with
              other variables
            </li>
            <li>
              <strong>Historical mode:</strong> Actual CPI inflation from the historical record
            </li>
          </ul>

          <p className="mt-4 text-stone-600 dark:text-stone-400">
            All returns are converted to <strong>real (inflation-adjusted)</strong> returns via the Fisher equation before being applied to
            portfolio balances. This means all projections are in today&apos;s purchasing power.
          </p>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Debt payments and fixed expenses <strong>deflate</strong> in real terms each month, modeling the effect of inflation eroding the
            real burden of fixed nominal obligations:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            newPayment = oldPayment / (1 + monthlyInflationRate)
          </div>
        </section>

        {/* 10. Glide Path Allocation */}
        <section id="glide-path" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">10. Glide Path Allocation</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            Users can define a <strong>glide path</strong> that transitions the portfolio&apos;s asset allocation from an initial stock/bond
            mix to a target mix over a specified age range. This is commonly used to reduce equity exposure as retirement approaches.
          </p>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            The target allocation at any age is computed as a <strong>linear interpolation</strong>:
          </p>
          <div className="mt-2 rounded-lg bg-stone-50 p-4 font-mono text-sm dark:bg-stone-800/50">
            progress = (currentAge − startAge) / (endAge − startAge)
            <br />
            targetStocks = initialStocks + (endTargetStocks − initialStocks) · progress
          </div>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Each account&apos;s <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs dark:bg-stone-800">percentBonds</code>{' '}
            is updated annually to match the glide path target. Contributions are allocated using the current target proportions, and
            withdrawals draw from the inverse proportions to maintain balance. This implicitly handles rebalancing through the natural flow
            of funds.
          </p>
        </section>

        {/* 11. Key Assumptions & Limitations */}
        <section id="assumptions" className="mb-16">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">11. Key Assumptions &amp; Limitations</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">State &amp; Local Taxes</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Only federal taxes are modeled. State income tax, state capital gains tax, and local taxes are not included. Users in
                high-tax states (CA, NY, OR, etc.) should expect their real tax burden to be higher than projected.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">Itemized Deductions</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Only the standard deduction is modeled. Itemized deductions (mortgage interest, charitable contributions, SALT, medical
                expenses) are not supported. The engine assumes all taxpayers take the standard deduction.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">Qualified Dividends</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                All dividends are treated as qualified (eligible for capital gains rates). In practice, some dividends may be non-qualified
                and taxed at ordinary rates.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">Tax Bracket Indexing</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Federal tax brackets, standard deductions, and Social Security thresholds are indexed annually at the user&apos;s specified
                inflation rate. This approximates the real-world inflation indexing of the tax code but may diverge from actual IRS
                adjustments.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">No Predictive Accuracy</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Past performance does not guarantee future results. The Monte Carlo simulations use historical volatility and correlation
                estimates that may not persist. Historical backtests replay specific sequences that may not repeat. All projections are
                educational tools for planning, not guarantees of future outcomes.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">Constant Contribution Limits</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                401(k), IRA, and HSA contribution limits are modeled as constant nominal amounts. The engine does not currently model future
                legislative changes to these limits beyond what the user explicitly configures via growth rates.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">No Tax-Loss Harvesting</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                The engine does not model tax-loss harvesting strategies. Capital losses are tracked and carried forward naturally when
                realized, but no active harvesting is simulated.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-700">
              <h3 className="font-semibold text-stone-900 dark:text-white">RMD Age</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                RMDs begin at age 73 (per SECURE Act 2.0). Users born after 1960 use age 75. The engine calculates RMD amounts using IRS
                Uniform Lifetime Table factors.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-stone-200 pt-8 dark:border-stone-700">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Ignidash is open-source (AGPL-3.0). The full source code for the simulation engine is available on{' '}
            <a
              href="https://github.com/ignidash/ignidash"
              className="font-medium text-rose-600 underline-offset-2 hover:text-rose-500 hover:underline dark:text-rose-400 dark:hover:text-rose-300"
            >
              GitHub
            </a>
            . If you find a bug or have a suggestion, please open an issue or pull request.
          </p>
        </div>
      </div>
    </MainArea>
  );
}
