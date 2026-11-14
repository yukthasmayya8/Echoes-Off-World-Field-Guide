import { describe, expect, it } from 'vitest';
import {
  evaluateLocalQuizAnswer,
  getLocalArtifactBySlug,
  getLocalQuiz,
  getLocalRouteBySlug,
  getLocalRoutes,
  listLocalArtifacts,
  localFallbackInfo,
  LocalQuizError,
  searchLocalCatalog,
} from './localFallback';

describe('local DEMO MODE fallback', () => {
  it('reports only verified artifacts', () => {
    expect(localFallbackInfo()).toMatchObject({
      demo: true,
      artifacts: 4,
      routes: 2,
      quizzes: 4,
    });
  });

  it('searches by name, alias, NSSDCA ID and destination', () => {
    expect(searchLocalCatalog('sojour').results[0]?.slug).toBe('sojourner');
    expect(searchLocalCatalog('Rocky IV').results[0]?.slug).toBe('sojourner');
    expect(searchLocalCatalog('1969-059C').results[0]?.slug).toBe('apollo-11-eagle');

    const moon = searchLocalCatalog('moon');
    expect(moon.count).toBe(2);
    expect(moon.results.every((entry) => entry.body === 'moon')).toBe(true);
  });

  it('never exposes needs_review records', () => {
    expect(searchLocalCatalog('intrepid').count).toBe(0);
    expect(getLocalArtifactBySlug('apollo-12-intrepid')).toBeUndefined();
    expect(getLocalQuiz('apollo-12-intrepid')).toBeUndefined();
    expect(
      listLocalArtifacts({ status: 'all' }).artifacts.some(
        (artifact) => artifact.slug === 'apollo-12-intrepid',
      ),
    ).toBe(false);
  });

  it('returns verified artifact details with five chapters and sources', () => {
    const artifact = getLocalArtifactBySlug('apollo-11-eagle');
    expect(artifact).toBeDefined();
    expect(artifact?.story.chapters).toHaveLength(5);
    expect(artifact?.nssdca.recordId).toBe('1969-059C');
    expect(artifact?.sources.length).toBeGreaterThan(0);
    expect(artifact?.image?.credit.length).toBeGreaterThan(0);
  });

  it('lists and resolves guided routes using verified artifacts only', () => {
    const routes = getLocalRoutes();
    expect(routes).toHaveLength(2);

    const marsRoute = getLocalRouteBySlug('mars-lander-and-rover');
    expect(marsRoute?.steps.map((step) => step.artifactSlug)).toEqual([
      'mars-pathfinder-lander',
      'sojourner',
    ]);

    for (const route of routes) {
      for (const step of route.steps) {
        expect(getLocalArtifactBySlug(step.artifactSlug)).toBeDefined();
      }
    }
  });

  it('strips answer keys from the public quiz payload', () => {
    const quiz = getLocalQuiz('sojourner');
    expect(quiz).toBeDefined();
    expect(quiz?.questions[0]?.options.length).toBeGreaterThanOrEqual(2);
    expect(quiz?.questions[0]).not.toHaveProperty('correctOptionId');
    expect(quiz?.questions[0]).not.toHaveProperty('explanation');

    const serialized = JSON.stringify(quiz);
    expect(serialized).not.toContain('correctOptionId');
    expect(serialized).not.toContain('"explanation"');
  });

  it('evaluates a correct answer locally and labels the evaluation', () => {
    const result = evaluateLocalQuizAnswer('sojourner', 'ramp');
    expect(result.evaluatedBy).toBe('local');
    expect(result.correct).toBe(true);
    expect(result.sources[0]?.id).toBe('nssdca-mesurpr');
  });

  it('evaluates an incorrect answer locally', () => {
    const result = evaluateLocalQuizAnswer('apollo-11-eagle', 'recovered');
    expect(result.correct).toBe(false);
    expect(result.correctOptionId).toBe('unknown-crash');
  });

  it('rejects an unknown option and an unknown artifact', () => {
    expect(() => evaluateLocalQuizAnswer('sojourner', 'not-an-option')).toThrowError(
      LocalQuizError,
    );
    expect(() => evaluateLocalQuizAnswer('missing-artifact', 'ramp')).toThrowError(
      LocalQuizError,
    );

    try {
      evaluateLocalQuizAnswer('sojourner', 'not-an-option');
    } catch (error) {
      expect((error as LocalQuizError).code).toBe('INVALID_ANSWER');
    }
  });
});
