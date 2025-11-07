import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  plans: defineTable({
    userId: v.string(),
    name: v.string(),

    // Timeline
    timeline: v.union(
      v.object({
        currentAge: v.number(),
        lifeExpectancy: v.number(),
        retirementStrategy: v.union(
          v.object({ type: v.literal('fixedAge'), retirementAge: v.number() }),
          v.object({ type: v.literal('swrTarget'), safeWithdrawalRate: v.number() })
        ),
      }),
      v.null()
    ),

    // Incomes - array of income objects
    incomes: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        amount: v.number(),
        frequency: v.union(
          v.literal('yearly'),
          v.literal('oneTime'),
          v.literal('quarterly'),
          v.literal('monthly'),
          v.literal('biweekly'),
          v.literal('weekly')
        ),
        timeframe: v.object({
          start: v.object({
            type: v.union(
              v.literal('now'),
              v.literal('atRetirement'),
              v.literal('atLifeExpectancy'),
              v.literal('customDate'),
              v.literal('customAge')
            ),
            month: v.optional(v.number()),
            year: v.optional(v.number()),
            age: v.optional(v.number()),
          }),
          end: v.optional(
            v.object({
              type: v.union(
                v.literal('now'),
                v.literal('atRetirement'),
                v.literal('atLifeExpectancy'),
                v.literal('customDate'),
                v.literal('customAge')
              ),
              month: v.optional(v.number()),
              year: v.optional(v.number()),
              age: v.optional(v.number()),
            })
          ),
        }),
        growth: v.optional(
          v.object({
            growthRate: v.optional(v.number()),
            growthLimit: v.optional(v.number()),
          })
        ),
        taxes: v.object({
          incomeType: v.union(
            v.literal('wage'),
            v.literal('exempt'),
            v.literal('selfEmployment'),
            v.literal('socialSecurity'),
            v.literal('pension')
          ),
          withholding: v.optional(v.number()),
        }),
        disabled: v.boolean(),
      })
    ),

    // Expenses - array of expense objects
    expenses: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        amount: v.number(),
        frequency: v.union(
          v.literal('yearly'),
          v.literal('oneTime'),
          v.literal('quarterly'),
          v.literal('monthly'),
          v.literal('biweekly'),
          v.literal('weekly')
        ),
        timeframe: v.object({
          start: v.object({
            type: v.union(
              v.literal('now'),
              v.literal('atRetirement'),
              v.literal('atLifeExpectancy'),
              v.literal('customDate'),
              v.literal('customAge')
            ),
            month: v.optional(v.number()),
            year: v.optional(v.number()),
            age: v.optional(v.number()),
          }),
          end: v.optional(
            v.object({
              type: v.union(
                v.literal('now'),
                v.literal('atRetirement'),
                v.literal('atLifeExpectancy'),
                v.literal('customDate'),
                v.literal('customAge')
              ),
              month: v.optional(v.number()),
              year: v.optional(v.number()),
              age: v.optional(v.number()),
            })
          ),
        }),
        growth: v.optional(
          v.object({
            growthRate: v.optional(v.number()),
            growthLimit: v.optional(v.number()),
          })
        ),
        disabled: v.boolean(),
      })
    ),

    accounts: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        balance: v.number(),
        type: v.union(
          v.literal('savings'),
          v.literal('taxableBrokerage'),
          v.literal('roth401k'),
          v.literal('rothIra'),
          v.literal('401k'),
          v.literal('ira'),
          v.literal('hsa')
        ),
        percentBonds: v.optional(v.number()),
        costBasis: v.optional(v.number()),
        contributionBasis: v.optional(v.number()),
      })
    ),

    contributionRules: v.array(
      v.object({
        id: v.string(),
        accountId: v.string(),
        rank: v.number(),
        amount: v.union(
          v.object({ type: v.literal('dollarAmount'), dollarAmount: v.number() }),
          v.object({ type: v.literal('percentRemaining'), percentRemaining: v.number() }),
          v.object({ type: v.literal('unlimited') })
        ),
        disabled: v.boolean(),
        maxBalance: v.optional(v.number()),
        incomeIds: v.optional(v.array(v.string())),
        employerMatch: v.optional(v.number()),
      })
    ),

    baseContributionRule: v.object({
      type: v.union(v.literal('spend'), v.literal('save')),
    }),

    marketAssumptions: v.object({
      stockReturn: v.number(),
      stockYield: v.number(),
      bondReturn: v.number(),
      bondYield: v.number(),
      cashReturn: v.number(),
      inflationRate: v.number(),
    }),
  }).index('by_userId', ['userId']),
});
