import { v } from 'convex/values';

export const liabilityValidator = v.object({
  id: v.string(),
  name: v.string(),
  balance: v.number(),
  updatedAt: v.number(),
  url: v.optional(v.string()),
  type: v.union(
    v.literal('mortgage'),
    v.literal('autoLoan'),
    v.literal('studentLoan'),
    v.literal('personalLoan'),
    v.literal('creditCard'),
    v.literal('medicalDebt'),
    v.literal('other')
  ),
});
