"use client";

import { useState } from "react";
import { Input } from "@/components/catalyst/input";
import { Card } from "@/components/card";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export function GlobalSettings() {
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState("4");
  const [inflationRate, setInflationRate] = useState("3");
  const [lifeExpectancy, setLifeExpectancy] = useState("85");
  const [currencyFormat, setCurrencyFormat] = useState("today"); // "today" or "future"

  return (
    <>
      <div className="border-foreground/10 mb-5 border-b pb-5">
        <div className="ml-2">
          <h4 className="text-base font-semibold">Withdrawal Strategy</h4>
        </div>
        <Card>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div key="safe-withdrawal-rate">
              <label
                htmlFor="safe-withdrawal-rate"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Safe Withdrawal Rate (%)
              </label>
              <Input
                id="safe-withdrawal-rate"
                type="number"
                value={safeWithdrawalRate}
                onChange={(e) => setSafeWithdrawalRate(e.target.value)}
                placeholder="4"
                min="2"
                max="6"
                step="0.1"
              />
              <p className="text-muted-foreground mt-2 text-xs">
                How much of your portfolio you can safely withdraw each year in
                retirement (2-6%).
              </p>
            </div>
          </form>
        </Card>
      </div>
      <div className="border-foreground/10 mb-5 border-b pb-5">
        <div className="ml-2">
          <h4 className="text-base font-semibold">
            Death & <span className="line-through decoration-2">Taxes</span>{" "}
            Inflation
          </h4>
        </div>

        <Card>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div key="life-expectancy">
              <label
                htmlFor="life-expectancy"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Life Expectancy (years)
              </label>
              <Input
                id="life-expectancy"
                type="number"
                value={lifeExpectancy}
                onChange={(e) => setLifeExpectancy(e.target.value)}
                placeholder="85"
                min="50"
                max="110"
              />
              <p className="text-muted-foreground mt-2 text-xs">
                How far out to project all FIRE calculations (50-110 years). See{" "}
                <a
                  href="https://www.cdc.gov/nchs/fastats/life-expectancy.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 underline hover:text-rose-700"
                >
                  CDC life expectancy data
                </a>{" "}
                for current averages.
              </p>
            </div>
            <div key="inflation-rate">
              <label
                htmlFor="inflation-rate"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Inflation Rate (%)
              </label>
              <Input
                id="inflation-rate"
                type="number"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                placeholder="3"
                min="0"
                max="8"
                step="0.1"
              />
              <p className="text-muted-foreground mt-2 text-xs">
                Used for real return calculations (0-8%). See{" "}
                <a
                  href="https://www.bls.gov/charts/consumer-price-index/consumer-price-index-by-category-line-chart.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 underline hover:text-rose-700"
                >
                  Bureau of Labor Statistics CPI data
                </a>{" "}
                for current inflation rates.
              </p>
            </div>
          </form>
        </Card>
      </div>
      <div className="mb-5 pb-5">
        <div className="ml-2">
          <h4 className="text-base font-semibold">Display</h4>
        </div>
        <Card>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div key="currency-display">
              <label
                htmlFor="currency-display"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Currency Format
              </label>
              <div className="mt-2 grid grid-cols-1">
                <select
                  id="currency-display"
                  name="currency-display"
                  value={currencyFormat}
                  onChange={(e) => setCurrencyFormat(e.target.value)}
                  className="focus:outline-foreground col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6"
                >
                  <option value="today">Today&apos;s Currency</option>
                  <option value="future">Future Inflated Currency</option>
                </select>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                Today&apos;s currency shows purchasing power now, future
                currency show nominal amounts at retirement.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
