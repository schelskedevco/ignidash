import { v } from 'convex/values';

export const PLAID_ACCOUNT_VALIDATOR = v.object({
  plaidAccountId: v.string(),
  name: v.string(),
  officialName: v.optional(v.string()),
  type: v.string(),
  subtype: v.optional(v.string()),
});

export const PLAID_LIABILITY_TYPE_VALIDATOR = v.union(
  v.literal('mortgage'),
  v.literal('autoLoan'),
  v.literal('studentLoan'),
  v.literal('personalLoan'),
  v.literal('creditCard'),
  v.literal('medicalDebt'),
  v.literal('other')
);

export const PLAID_ASSET_TYPE_VALIDATOR = v.union(
  v.literal('savings'),
  v.literal('checking'),
  v.literal('taxableBrokerage'),
  v.literal('roth401k'),
  v.literal('roth403b'),
  v.literal('rothIra'),
  v.literal('401k'),
  v.literal('403b'),
  v.literal('ira'),
  v.literal('hsa'),
  v.literal('realEstate'),
  v.literal('vehicle'),
  v.literal('preciousMetals'),
  v.literal('other')
);
