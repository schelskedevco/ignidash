import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// The publish workflow builds each image per platform, uploads one digest artifact per
// build, and then, per image, downloads that image's artifacts by pattern to create its
// multi-platform manifest. If one image's pattern also matches another image's artifacts,
// the manifest is built from the wrong digests and the push fails ("not found"), as it did
// when `digests-ignidash-*` also matched `digests-ignidash-convex-init-*`.

type Step = { uses?: string; with?: Record<string, string> };
type Job = { strategy?: { matrix?: Record<string, unknown> }; steps?: Step[] };
type Workflow = { jobs: Record<string, Job> };
type Combination = Record<string, string>;

const workflowPath = resolve(__dirname, '../../.github/workflows/docker-publish.yml');

function loadWorkflow(): Workflow {
  return parse(readFileSync(workflowPath, 'utf8')) as Workflow;
}

/** Expands a job matrix the way GitHub Actions does, including `include` entries. */
function expandMatrix(matrix: Record<string, unknown>): Combination[] {
  const { include = [], ...axes } = matrix as { include?: Combination[] } & Record<string, string[]>;
  let combinations: Combination[] = [{}];
  for (const [key, values] of Object.entries(axes)) {
    combinations = combinations.flatMap((combination) => values.map((value) => ({ ...combination, [key]: String(value) })));
  }
  const axisKeys = new Set(Object.keys(axes));
  if (axisKeys.size === 0) return include.map((entry) => ({ ...entry }));
  return combinations.map((combination) => {
    const expanded = { ...combination };
    for (const entry of include) {
      const matchesAxes = Object.entries(entry).every(([key, value]) => !axisKeys.has(key) || combination[key] === value);
      if (matchesAxes) {
        for (const [key, value] of Object.entries(entry)) if (!axisKeys.has(key)) expanded[key] = String(value);
      }
    }
    return expanded;
  });
}

function render(template: string, combination: Combination): string {
  const rendered = template.replace(/\$\{\{\s*matrix\.([\w-]+)\s*\}\}/g, (_, key: string) => {
    if (!(key in combination)) throw new Error(`matrix.${key} is not defined for ${JSON.stringify(combination)}`);
    return combination[key];
  });
  if (rendered.includes('${{')) throw new Error(`Unsupported expression in "${template}"`);
  return rendered;
}

/** Matches like the download-artifact pattern for names without slashes, supporting only `*`. */
function globMatches(pattern: string, name: string): boolean {
  if (/[?[\]{}!]/.test(pattern)) throw new Error(`Only * is supported in artifact patterns: "${pattern}"`);
  const regex = new RegExp(
    `^${pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[^/]*')}$`
  );
  return regex.test(name);
}

function stepUsing(job: Job, action: string): Step {
  const step = job.steps?.find((candidate) => candidate.uses?.startsWith(`${action}@`));
  if (!step?.with) throw new Error(`No ${action} step found`);
  return step;
}

/** Returns, for each image, the artifacts its manifest job downloads and the ones it should. */
function digestArtifactSelection(workflow: Workflow) {
  const build = workflow.jobs.build;
  const merge = workflow.jobs.merge;
  const builds = expandMatrix(build.strategy!.matrix!);
  const nameTemplate = stepUsing(build, 'actions/upload-artifact').with!.name;
  const uploaded = builds.map((combination) => ({ image: combination.image, name: render(nameTemplate, combination) }));
  const patternTemplate = stepUsing(merge, 'actions/download-artifact').with!.pattern;

  return expandMatrix(merge.strategy!.matrix!).map((combination) => {
    const pattern = render(patternTemplate, combination);
    return {
      image: combination.image,
      pattern,
      downloaded: uploaded.filter(({ name }) => globMatches(pattern, name)).map(({ name }) => name),
      expected: uploaded.filter(({ image }) => image === combination.image).map(({ name }) => name),
    };
  });
}

describe('docker-publish.yml digest artifacts', () => {
  it('builds and publishes the same images', () => {
    const workflow = loadWorkflow();
    const built = new Set(expandMatrix(workflow.jobs.build.strategy!.matrix!).map(({ image }) => image));
    const published = new Set(expandMatrix(workflow.jobs.merge.strategy!.matrix!).map(({ image }) => image));
    expect(published).toEqual(built);
    expect(built.size).toBeGreaterThanOrEqual(2);
  });

  it('gives every build a unique artifact name', () => {
    const workflow = loadWorkflow();
    const nameTemplate = stepUsing(workflow.jobs.build, 'actions/upload-artifact').with!.name;
    const names = expandMatrix(workflow.jobs.build.strategy!.matrix!).map((combination) => render(nameTemplate, combination));
    expect(new Set(names).size).toBe(names.length);
  });

  it("downloads exactly each image's own digest artifacts", () => {
    for (const { image, pattern, downloaded, expected } of digestArtifactSelection(loadWorkflow())) {
      expect(expected.length, `${image} has no build artifacts`).toBeGreaterThan(0);
      expect(downloaded.sort(), `pattern "${pattern}" for ${image}`).toEqual(expected.sort());
    }
  });

  it('catches the naming that broke publishing (one image name prefixing another)', () => {
    const workflow = loadWorkflow();
    stepUsing(workflow.jobs.build, 'actions/upload-artifact').with!.name = 'digests-${{ matrix.image }}-${{ matrix.runner }}';
    stepUsing(workflow.jobs.merge, 'actions/download-artifact').with!.pattern = 'digests-${{ matrix.image }}-*';

    const app = digestArtifactSelection(workflow).find(({ image }) => image === 'ignidash')!;
    expect(app.downloaded).not.toEqual(app.expected);
    expect(app.downloaded.some((name) => name.includes('convex-init'))).toBe(true);
  });
});
