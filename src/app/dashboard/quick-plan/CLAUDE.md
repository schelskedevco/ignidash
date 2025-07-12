# Quick Plan FIRE Calculator Implementation Guide

## Overview

Quick Plan is the core FIRE calculator feature that provides instant projections for Traditional FIRE, Coast FIRE, and Barista FIRE paths. It emphasizes simplicity and progressive disclosure while offering powerful modeling capabilities for one-time events and advanced settings.

## Core Design Philosophy

- **4-field minimal experience** - Most users can complete in 30 seconds
- **Progressive disclosure** - Advanced options hidden but easily accessible
- **Educational focus** - Clear disclaimers, no personalized investment advice
- **Mobile-first** - Touch-friendly inputs and responsive design
- **Shareable results** - Reddit-optimized for viral growth

## Input Structure

### Core Inputs (Always Visible)

#### 1. Current Age

- **Type**: Number input
- **Range**: 16-100
- **Validation**: Required, must be valid integer
- **UI**: Standard number input with stepper buttons

#### 2. Annual Income (After-Tax)

- **Type**: Currency input
- **Validation**: Required, must be positive
- **UI**: Currency formatting with $ prefix
- **Advanced Settings** (in Advanced Settings drawer):
  - "Income growth rate"
  - **Default**: 3% annually
  - **Range**: 0-10%

#### 3. Annual Expenses (Current)

- **Type**: Currency input
- **Validation**: Required, must be positive, should be ≤ income
- **UI**: Currency formatting with $ prefix
- **Advanced Settings** (in Advanced Settings drawer):
  - "Expense growth rate"
    - **Default**: 3% annually
    - **Range**: 0-10%
  - "Retirement expenses"
    - **Default**: Same as current expenses
    - **UI**: Currency input or percentage of current expenses

#### 4. Current Net Worth (Invested Assets)

- **Type**: Currency input
- **Validation**: Required, must be non-negative
- **UI**: Currency formatting with $ prefix
- **Advanced Settings** (in Advanced Settings drawer):
  - "Asset allocation & expected returns"
  - **Stocks**: Default 70%, Expected return 7%
  - **Bonds**: Default 30%, Expected return 4%
  - **Cash**: Default 0%, Expected return 1%
  - **UI Note**: "Cash allocation also serves as emergency fund"

### FIRE Path Specific Inputs

These inputs appear contextually based on selected FIRE path:

#### Coast FIRE Additional Input

- **Target Full Retirement Age**
- **Type**: Number input
- **Range**: Current age + 10 to 100
- **Purpose**: When you want to fully retire (not coast age)

#### Barista FIRE Additional Input

- **Expected Side Income**
- **Type**: Currency input
- **Validation**: Must be positive, typically < current income
- **Purpose**: Annual income during Barista FIRE phase

### One-Time Events (Limit 3 Total)

Users can add up to 3 events total, mixing and matching:

#### Event Types

1. **Windfalls**
   - Amount (currency)
   - Year (current age + 1 to life expectancy)
   - Examples: Inheritance, bonus, stock options

2. **Major Purchases**
   - Amount (currency)
   - Year (current age + 1 to life expectancy)
   - Examples: House down payment, wedding, emergency

3. **Life Changes**
   - Amount per year (currency)
   - Start year (current age + 1 to life expectancy)
   - End year (must be > start year)
   - Examples: Kids, eldercare, education

4. **Career Breaks**
   - Income reduction amount (currency per year)
   - Start year (current age + 1 to life expectancy)
   - End year (must be > start year)
   - Examples: Sabbatical, parental leave, career change transition

#### UI Implementation

- **Add Event** button (disabled when 3 events exist)
- **Event Cards** showing type, amount, timing
- **Delete** button for each event
- **Event Counter** showing "2 of 3 events used"
- **Upgrade prompt**: When at 3/3 limit, show "Model unlimited life events with Pro" (inputs section upsell)

## UI Layout & Settings

### Header Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Your Numbers                                 [⚙️ Settings] │
└─────────────────────────────────────────────────────────────┘
```

### Advanced Settings Drawer

Triggered by "Advanced" button under Core Inputs card, contains input-specific advanced settings:

- Income growth rate
- Expense growth rate and retirement expenses
- Asset allocation & expected returns

### Settings Dialog/Drawer

Triggered by cog icon, contains global calculation settings:

#### Settings Options

- **Safe Withdrawal Rate**
  - 4% Rule (default)
  - 3.5% Conservative
  - 3.25% Very Conservative
  - Custom percentage (2-6%)

- **Inflation Rate**
  - Default: 3%
  - Range: 0-8%
  - Used for real return calculations

- **Life Expectancy**
  - Default: 85
  - Range: 70-110
  - Used for Coast FIRE calculations

- **Display Format**
  - Today's Dollars (default)
  - Future Inflated Dollars

#### Settings UI

- **Modal on desktop**, drawer on mobile
- **Save/Cancel** buttons
- **Reset to Defaults** option
- Settings persist in localStorage

## Technical Implementation

### State Management

```typescript
interface QuickPlanState {
  // Core inputs
  currentAge: number;
  annualIncome: number;
  annualExpenses: number;
  currentNetWorth: number;

  // Growth rates (progressive disclosure)
  incomeGrowthRate: number; // default 3%
  expenseGrowthRate: number; // default 3%
  retirementExpenses?: number; // optional override

  // Asset allocation (progressive disclosure)
  stockAllocation: number; // default 70%
  bondAllocation: number; // default 30%
  cashAllocation: number; // default 0%
  stockReturn: number; // default 7%
  bondReturn: number; // default 4%
  cashReturn: number; // default 1%

  // FIRE path specific
  firePath: "traditional" | "coast" | "barista";
  targetRetirementAge?: number; // Coast FIRE only
  baristaSideIncome?: number; // Barista FIRE only

  // One-time events
  events: Event[]; // max 3

  // Settings
  safeWithdrawalRate: number; // default 4%
  inflationRate: number; // default 3%
  lifeExpectancy: number; // default 85
  displayFormat: "today" | "future"; // default 'today'
}

interface Event {
  id: string;
  type: "windfall" | "majorPurchase" | "lifeChange" | "careerBreak";
  amount: number;
  year: number;
  endYear?: number; // only for lifeChange and careerBreak
}
```

### Validation Rules

- **Real-time validation** with debounced calculations
- **Income > Expenses** warning (not blocking)
- **Asset allocation must sum to 100%**
- **Event years must be realistic** (current age + 1 to life expectancy)
- **Positive values** for all monetary inputs
- **Age ranges** enforced for all age-related inputs

### Performance Considerations

- **Debounce calculations** by 300ms on input change
- **Memoize expensive calculations** using React.useMemo
- **Virtual scrolling** for long event lists (if needed)
- **Progressive enhancement** - basic calculations work without JS

### Data Persistence

- **localStorage** for return visits
- **URL parameters** for sharing (base64 encoded state)
- **No server storage** - privacy-first approach

## Outputs Structure

### Core Design Principles for Outputs

- **Visual-first approach**: Charts before tables, overview before details
- **Progressive disclosure**: Essential info first, advanced analysis for interested users
- **Achievement celebration**: Generic handling for any already-achieved FIRE type
- **Minimal duplication**: Strategic overlap only for essential information
- **Mobile-optimized**: Touch-friendly, responsive design
- **Shareability**: Reddit-optimized results with emotional hooks

### Output Sections (Matching Input Flow)

#### 1. Results Overview

**Purpose**: Immediate gratification and key takeaways

**Components**:

- **Dynamic English hook**: Simple context-aware messaging
  - Traditional FIRE: "You could reach FI at age 42!"
  - Coast FIRE: "You're already coasting to FI!"
  - Multiple paths: "You have 3 paths to financial independence"
- **Core metrics for enabled paths**: Show essential results only
  - Years to FI
  - Age at FI
  - Net Worth needed
- **Simple achievement status**: Basic binary state
  - ✅ "Already achieved" or "X years to go"
  - No complex progress indicators or trajectory analysis
- **Share button**: Basic social sharing functionality
- **Pro upsell**: "Save and compare multiple scenarios with Pro" (subtle, contextual)

**Mobile Implementation**:

- Stack metrics vertically with good spacing and typography
- Basic share button
- Clean, minimal design without card containers

#### 2. Net Worth Chart

**Purpose**: Visual understanding of financial trajectory

**Components**:

- **Multi-path visualization**: All enabled FIRE paths on single chart
  - Traditional FIRE line
  - Coast FIRE target line (if enabled)
  - Barista FIRE transition point (if enabled)
  - **Alternative approach**: If single chart becomes cluttered (especially on mobile), implement tab-based charts where users can select specific FIRE type to view individual charts
- **Simple event markers**: Basic visual indicators showing timing
  - Windfalls (green dot)
  - Major purchases (red dot)
  - Life changes (blue dot)
  - Career breaks (orange dot)
- **Basic interactions**: Hover for event details only
- **Real-time updates**: Chart updates as users adjust inputs

**Technical Specifications**:

- **Library**: Recharts for React integration (charts not available in Tailwind Plus)
- **Performance**: Debounced updates, memoized calculations
- **Accessibility**: ARIA labels, keyboard navigation
- **Responsive**: Standard responsive behavior

#### 3. FIRE Path Comparison Table (Conditional)

**Display Logic**: Only show when multiple FIRE paths are enabled

**Simple Table Structure**:

```
| Path Type    | Years to FI | Age at FI | Net Worth Needed | Success Rate |
|--------------|-------------|-----------|------------------|--------------|
| Traditional  | 12.3 years  | Age 42    | $1,250,000      | 87%          |
| Coast FIRE   | 8.1 years   | Age 38    | $850,000        | 95%          |
| Barista FIRE | 9.5 years   | Age 40    | $900,000        | 91%          |
```

**Note**: Status (already achieved vs years away) can be deduced from Years to FI and Age at FI columns. Alternative column option: Monthly Savings Required instead of Success Rate.

**Mobile Optimization**:

- Simple stacked cards view
- No sorting or interactive features
- Clean, readable layout

#### 4. Event Impact Summary

**Purpose**: Quantify how life events affect FIRE timeline

**Components**:

- **Individual event analysis**: Simple impact statements
  - "House down payment delays FIRE by 1.2 years"
  - "Inheritance accelerates FIRE by 3.4 years"
  - "Career break extends timeline by 2.1 years"
  - "Child expenses add 4.2 years to FIRE"
- **Cumulative effects**: "All events combined delay FIRE by 2.8 years"
- **Simple optimization suggestions** (1-2 max, rule-based):
  - "Moving house purchase 2 years later would save 8 months to FI"
  - "Timing career break after age 35 would reduce impact by 6 months"

**Event Categories**:

- **Accelerating events**: Windfalls (positive impact)
- **Delaying events**: Major purchases, career breaks, life changes (negative impact)

**Display**: Static text analysis with simple timing-focused optimization suggestions

#### 5. Success Probability & Analysis

**Purpose**: Address risk and uncertainty in projections

**Simple Monte Carlo Implementation**:

- **Simulation parameters**: 10,000 runs for statistical significance
- **Variable factors**: Stock/bond returns with historical volatility
- **Computational approach**: Web Workers for heavy calculations

**Output Display**:

- **Success probability percentage**: "89% chance of success"
- **Basic historical context**: "Based on historical market data since 1871"
- **Worst-case scenario context**: "In the worst historical period (Great Depression), you'd reach FI 3 years later"
- **Improvement threshold**: "Reducing expenses by $200/month would increase success to 94%"
- **Simple risk level**: Traffic light indicator
  - Green (>90%): "High confidence"
  - Yellow (70-90%): "Moderate confidence"
  - Red (<70%): "Lower confidence"

**Display**: Static analysis with no interactive elements or detailed breakdowns

#### 6. Intelligent Explanation

**Purpose**: Contextual insights and emotional engagement

**Simple Rule-Based Insights**:

- **Basic scenario detection**: High-level observations
  - Coast FIRE achieved: "You have incredible flexibility"
  - Long timeline: "Small changes can have big impact"
  - Multiple paths: "You have several options to consider"

**Lifestyle Implications**:

- **Path-specific lifestyle context**: What each path means for your life
  - Traditional FIRE: "Complete financial freedom at 42 - pursue any passion without income constraints"
  - Coast FIRE: "Stop saving at 38, work flexibly knowing retirement is secured"
  - Barista FIRE: "Transition to meaningful part-time work at 40 with reduced financial pressure"

**Emotional Engagement**:

- **Simple reflection prompt**: "Does this timeline feel right to you?"
- **Lifestyle visualization**: "At 42, you'd have 40+ years to pursue whatever excites you"

**Clear Upgrade CTAs**:

- **Pro+AI upsell**: "Want personalized guidance? Get AI-powered insights with Pro+AI"
- **Simple call to action**: Clear next step for interested users

**Display**: Static insights with no complex personalization or detailed analysis

### Core Calculations

#### Traditional FIRE

```
FIRE Number = Annual Expenses / Safe Withdrawal Rate
Years to FIRE = Time to reach FIRE Number given:
  - Current net worth
  - Monthly savings (income - expenses)
  - Expected portfolio return
  - One-time events
```

#### Coast FIRE

```
Required Coast Amount = FIRE Number / (1 + return)^years_to_retirement
Current Coast Status = Current Net Worth >= Required Coast Amount
Years to Coast = Time to reach Required Coast Amount
```

#### Barista FIRE

```
Barista FIRE Number = (Annual Expenses - Side Income) / Safe Withdrawal Rate
Years to Barista FIRE = Time to reach Barista FIRE Number
```

### Technical Implementation Specifications

#### Chart Requirements

- **Library**: Recharts for React integration (charts not available in Tailwind Plus)
- **Performance**:
  - Debounced updates (300ms)
  - Memoized calculations using React.useMemo
  - Efficient re-renders with React.memo
- **Animations**: Smooth transitions for user engagement
- **Responsiveness**: Mobile-first design with breakpoint considerations
- **Accessibility**:
  - ARIA labels for screen readers
  - Keyboard navigation support
  - High contrast mode compatibility

#### Table Specifications

- **Component Source**: Tailwind Plus UI blocks for table formatting and styling
- **Responsive behavior**:
  - Desktop: Full table display using Tailwind Plus table components
  - Mobile: Stacked cards or horizontal scroll with Tailwind Plus responsive utilities
- **Sorting capability**: Click column headers to sort (enhanced with Tailwind Plus styling)
- **Highlighting**: Emphasize optimal or achieved paths using Tailwind Plus color schemes
- **Export functionality**: PDF download for results

#### Success Probability Calculations

- **Historical data**: S&P 500 and bond returns since 1871
- **Monte Carlo engine**:
  - 10,000 simulations for statistical significance
  - Variable inflation based on historical ranges
  - Sequence of returns risk modeling
- **Performance optimization**:
  - Web Workers for heavy calculations
  - Progressive result display
  - Caching for repeated calculations

### Marketing Strategy Alignment

**Landing Page Promise Delivery**:

- **"Every FIRE Path, Clearly Mapped"**: Comparison table and chart visualization
- **"Play Out Your What-Ifs"**: Event impact analysis and optimization
- **"Share Your Plan"**: Optimized share functionality with social preview
- **"Which path excites you most?"**: Emotional engagement in explanation section

**Reddit Virality Features**:

- **Shareable moments**: "I discovered I could CoastFIRE at 40!"
- **Authentic language**: Conversational, not corporate
- **Visual results**: Charts and tables that screenshot well
- **Success stories**: Achievement celebrations that inspire sharing

### Performance Targets (Updated)

- **Initial render**: < 1 second for results overview
- **Chart interactions**: < 100ms response time
- **Monte Carlo calculation**: < 2 seconds with progress indicator
- **Table sorting/filtering**: < 50ms response time
- **Mobile performance**: 60fps animations on modern devices
- **Accessibility**: WCAG 2.1 AA compliance across all components

## Legal Compliance

### Required Disclaimers

All disclaimers must be prominent and clearly visible:

#### Primary Disclaimer (Above Results)

```
"This calculator is for educational purposes only and does not constitute
personalized financial advice. Results are hypothetical projections based
on your inputs and assumptions. Consult a licensed financial advisor for
personalized advice."
```

#### Secondary Disclaimers

- **Investment Returns**: "Past performance does not guarantee future results"
- **Inflation**: "Inflation estimates are assumptions and may vary significantly"
- **Life Expectancy**: "Life expectancy is an estimate and individual results may vary"

### Prohibited Content

- **No specific fund recommendations** (no "invest in VTSAX")
- **No portfolio allocation advice** (no "you should allocate 70% to stocks")
- **No personalized strategies** (no "you should retire at 45")
- **No guarantee language** (no "you will retire in X years")

### Compliant Language Examples

- ✅ "Based on your inputs, you might reach FIRE in..."
- ✅ "This projection assumes..."
- ✅ "Consider various scenarios..."
- ❌ "You should invest in..."
- ❌ "We recommend..."
- ❌ "You will retire in..."

## User Experience Guidelines

### Advanced Settings Implementation

- **Separate Advanced Settings drawer** for input-specific settings
- **Clean Core Inputs** without inline disclosure components
- **Sensible defaults** that work for most users
- **Contextual help** tooltips for complex concepts
- **Visual hierarchy** to guide user attention

### Mobile Optimization

- **Touch-friendly** input controls (minimum 44px tap targets)
- **Responsive charts** that work on small screens
- **Simplified mobile layout** with stacked sections
- **Swipe gestures** for navigating between FIRE paths

### Accessibility

- **Semantic HTML** structure
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** mode compatibility
- **Focus indicators** for all interactive elements

### Error Handling

- **Inline validation** with clear error messages
- **Graceful degradation** when calculations fail
- **Helpful suggestions** for fixing input errors
- **Loading states** during calculations

### Shareability Features

- **Generate shareable URL** with encoded state
- **Social media optimized** preview cards
- **Export to PDF** functionality
- **Reddit-friendly** formatting for results

## Performance Targets

- **Initial load**: < 2 seconds
- **Calculation updates**: < 100ms
- **Settings dialog**: < 200ms to open
- **Mobile responsiveness**: Works on iOS Safari and Android Chrome

## Future Enhancements (Not MVP)

### Output Section Stretch Goals

- **Results Overview**: Visual timeline showing "You are here → FI at 42" progress indicator
- **Net Worth Chart**: Chart annotations explaining key moments ("This is when you hit Coast FIRE")
- **FIRE Path Comparison**: "Lifestyle" column showing practical implications of each path
- **Event Impact Summary**: Advanced multi-variable optimization with scenario modeling
- **Success Probability**: Benchmark comparisons vs similar user situations
- **Intelligent Explanation**: Scenario-specific decision support and lifestyle insights (AI-powered, paid tier)

### General Enhancements

- **Multiple plan comparison** (paid feature)
- **Tax-advantaged account modeling**
- **International currency support**
- **Advanced withdrawal strategies**
- **Detailed breakdown exports**
- **AI-powered optimization suggestions**
- **Portfolio rebalancing over time** - Feature to model changing asset allocation as users age (e.g., glide path from aggressive to conservative)

## Implementation Priority

1. **Core inputs** with basic calculations
2. **Progressive disclosure** for advanced options
3. **Settings dialog** with global options
4. **One-time events** functionality
5. **Results overview** with key metrics
6. **Interactive net worth chart** with event markers
7. **FIRE path comparison table** (conditional)
8. **Event impact summary** with optimization suggestions
9. **Success probability** with Monte Carlo analysis
10. **Intelligent explanation** with emotional engagement
11. **Shareability** features and social optimization
12. **Mobile optimization** and responsive design
13. **Legal compliance** review and disclaimers
