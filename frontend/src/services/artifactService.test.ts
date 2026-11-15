import { describe, expect, it, vi } from 'vitest';
import type { ArtifactListResult } from '@echoes/shared';
import { ApiRequestError, type EchoesApiClient } from './api';
import { ArtifactService } from './artifactService';

const emptyList: ArtifactListResult = {
  count: 0,
  filters: { status: 'verified', q: '' },
  artifacts: [],
};

function clientWith(overrides: Record<string, unknown>): EchoesApiClient {
  return overrides as unknown as EchoesApiClient;
}

describe('ArtifactService', () => {
  it('uses the API first and reports source "api"', async () => {
    const fake = clientWith({ getArtifacts: vi.fn().mockResolvedValue(emptyList) });
    const service = new ArtifactService(fake);

    const result = await service.getArtifacts();

    expect(result.source).toBe('api');
    expect(result.data).toEqual(emptyList);
    expect(result.notice).toBeUndefined();
  });

  it('falls back to the verified local dataset when the API is unavailable', async () => {
    const fake = clientWith({
      getArtifacts: vi
        .fn()
        .mockRejectedValue(new ApiRequestError('NETWORK_ERROR', 'fetch failed')),
      getArtifactBySlug: vi
        .fn()
        .mockRejectedValue(new ApiRequestError('REQUEST_TIMEOUT', 'timed out')),
      searchCatalog: vi
        .fn()
        .mockRejectedValue(new ApiRequestError('SERVER_ERROR', 'server down', { status: 503 })),
      getRoutes: vi
        .fn()
        .mockRejectedValue(new ApiRequestError('NETWORK_ERROR', 'fetch failed')),
      getQuiz: vi.fn().mockRejectedValue(new ApiRequestError('NETWORK_ERROR', 'fetch failed')),
    });
    const service = new ArtifactService(fake);

    const catalog = await service.getArtifacts();
    expect(catalog.source).toBe('demo');
    expect(catalog.notice).toContain('verified local archive');
    expect(catalog.data.count).toBe(4);

    const search = await service.searchCatalog('sojour');
    expect(search.source).toBe('demo');
    expect(search.data.results[0]?.slug).toBe('sojourner');

    const artifact = await service.getArtifactBySlug('apollo-11-eagle');
    expect(artifact.source).toBe('demo');
    expect(artifact.data.slug).toBe('apollo-11-eagle');

    const routes = await service.getRoutes();
    expect(routes.source).toBe('demo');
    expect(routes.data.routes).toHaveLength(2);

    const quiz = await service.getQuiz('sojourner');
    expect(quiz.source).toBe('demo');
    expect(quiz.data.questions[0]).not.toHaveProperty('correctOptionId');
  });

  it('does not mask a genuine 404 with the demo dataset', async () => {
    const fake = clientWith({
      getArtifactBySlug: vi
        .fn()
        .mockRejectedValue(
          new ApiRequestError('NOT_FOUND', 'No artifact.', { status: 404 }),
        ),
    });
    const service = new ArtifactService(fake);

    await expect(service.getArtifactBySlug('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('evaluates answers locally in demo mode and marks evaluatedBy "local"', async () => {
    const fake = clientWith({
      submitQuizAnswer: vi
        .fn()
        .mockRejectedValue(new ApiRequestError('REQUEST_TIMEOUT', 'timed out')),
    });
    const service = new ArtifactService(fake);

    const result = await service.submitQuizAnswer('sojourner', 'ramp');

    expect(result.source).toBe('demo');
    expect(result.data.evaluatedBy).toBe('local');
    expect(result.data.correct).toBe(true);
    expect(result.data.sources.length).toBeGreaterThan(0);
  });

  it('does not fall back for a 400 invalid answer', async () => {
    const fake = clientWith({
      submitQuizAnswer: vi
        .fn()
        .mockRejectedValue(
          new ApiRequestError('INVALID_ANSWER', 'Not an option.', { status: 400 }),
        ),
    });
    const service = new ArtifactService(fake);

    await expect(service.submitQuizAnswer('sojourner', 'nope')).rejects.toMatchObject({
      code: 'INVALID_ANSWER',
      status: 400,
    });
  });
});
