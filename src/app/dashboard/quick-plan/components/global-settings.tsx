"use client";

import { useState } from "react";
import { Input } from "@/components/catalyst/input";
import { Card } from "@/components/card";

export function GlobalSettings() {
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState("4");
  const [inflationRate, setInflationRate] = useState("3");
  const [lifeExpectancy, setLifeExpectancy] = useState("85");

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
            </div>

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
                min="70"
                max="110"
              />
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
