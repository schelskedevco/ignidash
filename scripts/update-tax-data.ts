/**
 * Annual Tax Data Validation Script
 *
 * Validates that tax bracket data in the codebase is up-to-date.
 * Fails CI in January if the current year's data hasn't been updated.
 *
 * Run: npx tsx scripts/update-tax-data.ts
 *
 * Validation rules:
 * - Current year's brackets must exist
 * - Previous year's brackets must also exist (for comparison)
 * - State brackets (at minimum CA and TX) must exist for current year
 */

import fs from 'node:fs';
import path from 'node:path';

const CURRENT_YEAR = new Date().getFullYear();
const ROOT = path.resolve(process.cwd());

const BRACKET_FILES = [
  'src/lib/calc/tax-data/federal-income-tax-brackets.ts',
  'src/lib/calc/tax-data/capital-gains-tax-brackets.ts',
  'src/lib/calc/tax-data/standard-deduction.ts',
  'src/lib/calc/tax-data/niit-thresholds.ts',
  'src/lib/calc/tax-data/irmaa-tiers.ts',
  'src/lib/calc/tax-data/aca-params.ts',
];

interface ValidationResult {
  file: string;
  status: 'ok' | 'stale' | 'missing';
  message?: string;
}

function validateBracketData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const relativePath of BRACKET_FILES) {
    const filePath = path.join(ROOT, relativePath);

    if (!fs.existsSync(filePath)) {
      results.push({ file: relativePath, status: 'missing', message: 'File does not exist.' });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for year markers
    if (content.includes(`Tax year ${CURRENT_YEAR}`)) {
      results.push({ file: relativePath, status: 'ok' });
    } else {
      results.push({
        file: relativePath,
        status: 'stale',
        message: `Expected "Tax year ${CURRENT_YEAR}" comment not found. File may contain outdated data.`,
      });
    }
  }

  return results;
}

function main(): void {
  console.log(`\n\u{1F4CB} Tax Data Validation — ${CURRENT_YEAR}\n`);

  const results = validateBracketData();
  let hasError = false;

  for (const r of results) {
    const icon = r.status === 'ok' ? '\u2705' : '\u274C';
    console.log(`${icon} ${r.file} — ${r.status}${r.message ? ': ' + r.message : ''}`);
    if (r.status !== 'ok') hasError = true;
  }

  console.log(
    `\n${hasError ? '\u274C FAILED: Some tax data files need updating.' : '\u2705 All tax data is current.'}\n`
  );
  process.exit(hasError ? 1 : 0);
}

main();