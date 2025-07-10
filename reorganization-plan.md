# Your Numbers Settings Reorganization Plan

## Overview

This document outlines the reorganization of the "Your Numbers" settings in the Quick Plan FIRE calculator. The reorganization improves user experience by creating clearer sections and more focused settings drawers.

## Previous Structure

- **The Foundation**: Basic inputs (age, income, expenses, assets)
- **Alternative Strategies**: Coast FIRE and Barista FIRE options
- **Growth & Allocation Drawer**: Mixed settings for growth rates, asset allocation, and returns
- **Calculation Settings Drawer**: Withdrawal rate, life expectancy, inflation, and display format

## New Structure

### Main Screen Sections

#### 1. Basics

- Current Age
- Net Annual Income
- Annual Expenses
- Invested Assets

#### 2. Goal

- Retirement Expenses (moved from drawer to main screen)
- Coast FIRE option with Target Retirement Age
- Barista FIRE option with Expected Side Income

#### 3. Fine-Tune

Four drawer buttons for advanced settings:

##### a. Income & Spending Growth

- Income Growth Rate (%)
- Expense Growth Rate (%)

##### b. Investment Portfolio

- Asset Allocation:
  - Stocks (%)
  - Bonds (%)
  - Cash (%)

##### c. Market & Economic Assumptions

- Expected Returns:
  - Stock Returns (%)
  - Bond Returns (%)
  - Cash Returns (%)
- Inflation Rate (%)

##### d. Retirement Funding & Duration

- Safe Withdrawal Rate (%)
- Life Expectancy (years)

## Implementation Status

### Completed (Phase 1)

- ✅ Renamed "The Foundation" to "Basics"
- ✅ Created new "Goal" section with retirement expenses input
- ✅ Moved FIRE strategy options to Goal section
- ✅ Created "Fine-Tune" section with four drawer buttons
- ✅ Added appropriate icons for each drawer
- ✅ Set up drawer states and empty drawer components

### Pending (Next Steps)

- 🔄 Migrate content from existing drawers to new Fine-Tune drawers
- 🔄 Remove legacy Growth & Allocation drawer button and state
- 🔄 Remove legacy Calculation Settings drawer functionality
- 🔄 Delete old drawer components once migration is complete

## Key Improvements

1. **Better Organization**: Settings are now grouped logically by topic
2. **Progressive Disclosure**: Basic users see only essential inputs, advanced settings are in drawers
3. **Clearer Goals**: Retirement expenses moved to main screen for better visibility
4. **Focused Drawers**: Each drawer contains related settings only

## Notes

- Currency Format setting moved to Results side (not part of Your Numbers)
- All existing components preserved during transition to avoid breaking changes
- Empty drawers ready for content migration in next phase
